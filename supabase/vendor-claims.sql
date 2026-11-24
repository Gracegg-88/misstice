-- Parcours de réclamation d'une fiche importée (claim_status = 'non_reclamee').
-- 1. Le prestataire s'inscrit depuis le bouton « Réclamer ma fiche » : l'id de
--    la fiche importée voyage dans les métadonnées d'inscription et une
--    demande de rattachement est créée automatiquement (en attente).
-- 2. L'admin valide ou refuse dans /admin/reclamations (le SIRET étant
--    public, il ne prouve pas à lui seul la propriété : décision humaine).
-- 3. Validation : la fiche importée est rattachée au compte (elle garde son
--    adresse, sa date et son historique), les données saisies par le
--    prestataire et tout ce qui pointait vers la fiche créée à l'inscription
--    y sont reportés, puis ce doublon est supprimé.
-- Idempotent : peut être relancé sans effet de bord.

-- ─── 1. Table des demandes ──────────────────────────────────────────────
create table if not exists public.vendor_claim_requests (
  id uuid primary key default gen_random_uuid(),
  imported_vendor_id uuid not null references public.vendors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'en_attente'
    check (status in ('en_attente', 'validee', 'refusee')),
  motif_refus text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id)
);

-- Une seule demande en attente par compte et par fiche.
create unique index if not exists vendor_claim_requests_pending_uniq
  on public.vendor_claim_requests (imported_vendor_id, user_id)
  where status = 'en_attente';

alter table public.vendor_claim_requests enable row level security;

drop policy if exists "claims_read_own" on public.vendor_claim_requests;
create policy "claims_read_own" on public.vendor_claim_requests
  for select using (user_id = auth.uid() or public.is_admin());

-- Création par le prestataire lui-même (cas où il réclame après coup,
-- depuis son espace pro) : seulement pour lui, seulement une fiche importée.
drop policy if exists "claims_insert_own" on public.vendor_claim_requests;
create policy "claims_insert_own" on public.vendor_claim_requests
  for insert with check (
    user_id = auth.uid()
    and status = 'en_attente'
    and exists (
      select 1 from public.vendors v
      where v.id = imported_vendor_id and v.claim_status = 'non_reclamee' and v.user_id is null
    )
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'prestataire')
  );
-- Aucune politique UPDATE/DELETE : seules les fonctions admin ci-dessous
-- changent le statut.

-- ─── 2. Demande créée automatiquement à l'inscription ───────────────────
-- Ajout à handle_new_user() (définition autoritaire : supabase/security.sql),
-- à la fin du bloc « prestataire » : si les métadonnées portent
-- claim_vendor_id et que la fiche est bien importée et libre.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role     text;
  v_company  text;
  v_category text;
  v_city     text;
  v_claim    uuid;
begin
  v_role := coalesce(new.raw_user_meta_data ->> 'role', 'particulier');
  -- Anti-escalade : 'admin' (ou toute valeur inconnue) est refusé ici.
  if v_role not in ('particulier', 'prestataire') then
    v_role := 'particulier';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    v_role
  )
  on conflict (id) do nothing;

  if v_role = 'prestataire' then
    v_company  := new.raw_user_meta_data ->> 'company';
    v_category := new.raw_user_meta_data ->> 'category';
    v_city     := new.raw_user_meta_data ->> 'city';

    if coalesce(v_company, '') <> '' then
      insert into public.vendor_profiles (id, company, category, city)
      values (new.id, v_company, v_category, v_city)
      on conflict (id) do nothing;

      insert into public.vendors (name, category, city, user_id, verified)
      values (v_company, coalesce(nullif(v_category, ''), 'Autre'), v_city, new.id, false);
    end if;

    -- Réclamation d'une fiche importée (bouton « Réclamer ma fiche »).
    begin
      v_claim := nullif(new.raw_user_meta_data ->> 'claim_vendor_id', '')::uuid;
    exception when others then
      v_claim := null; -- valeur invalide : on ignore, l'inscription continue
    end;
    if v_claim is not null and exists (
      select 1 from public.vendors
      where id = v_claim and claim_status = 'non_reclamee' and user_id is null
    ) then
      insert into public.vendor_claim_requests (imported_vendor_id, user_id)
      values (v_claim, new.id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- ─── 3. Validation (admin) : fusion + suppression du doublon ────────────
create or replace function public.approve_vendor_claim(p_request_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r   public.vendor_claim_requests;
  imp public.vendors;
  dup public.vendors;
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  select * into r from public.vendor_claim_requests where id = p_request_id for update;
  if r.id is null or r.status <> 'en_attente' then
    raise exception 'Demande introuvable ou déjà traitée.';
  end if;

  select * into imp from public.vendors where id = r.imported_vendor_id for update;
  if imp.id is null or imp.user_id is not null or imp.claim_status <> 'non_reclamee' then
    raise exception 'Cette fiche a déjà été réclamée.';
  end if;

  -- Fiche créée automatiquement à l'inscription (le doublon), s'il y en a une.
  select * into dup from public.vendors
    where user_id = r.user_id and id <> imp.id
    order by created_at limit 1 for update;

  perform set_config('misstice.vendor_import', 'on', true);
  perform set_config('misstice.siret_check', 'on', true);
  perform set_config('misstice.stripe_check', 'on', true);

  if dup.id is not null then
    -- Tout ce qui pointait vers le doublon pointe désormais vers la fiche importée.
    update public.conversations     set vendor_id = imp.id where vendor_id = dup.id;
    update public.event_vendors     set vendor_id = imp.id where vendor_id = dup.id;
    update public.reviews           set vendor_id = imp.id where vendor_id = dup.id;
    update public.profile_views     set vendor_id = imp.id where vendor_id = dup.id;
    update public.city_category_picks set claimed_vendor_id = imp.id where claimed_vendor_id = dup.id;
    update public.city_event_picks    set claimed_vendor_id = imp.id where claimed_vendor_id = dup.id;
    -- Favoris : éviter un doublon (même client, même fiche).
    delete from public.vendor_favorites f
      where f.vendor_id = dup.id
        and exists (select 1 from public.vendor_favorites g where g.vendor_id = imp.id and g.user_id = f.user_id);
    update public.vendor_favorites set vendor_id = imp.id where vendor_id = dup.id;
  end if;

  -- Rattachement : la fiche importée garde son nom officiel, sa commune et son
  -- SIRET ; elle reprend ce que le prestataire a saisi sur sa fiche.
  update public.vendors set
    user_id         = r.user_id,
    claim_status    = 'reclamee',
    category        = coalesce(nullif(dup.category, 'Autre'), imp.category),
    tagline         = coalesce(dup.tagline, imp.tagline),
    price_from      = coalesce(dup.price_from, imp.price_from),
    image           = coalesce(dup.image, imp.image),
    verified        = coalesce(dup.verified, false),
    payouts_enabled = coalesce(dup.payouts_enabled, false),
    moods           = coalesce(dup.moods, imp.moods),
    energies        = coalesce(dup.energies, imp.energies),
    lights          = coalesce(dup.lights, imp.lights),
    palettes        = coalesce(dup.palettes, imp.palettes),
    atmospheres     = coalesce(dup.atmospheres, imp.atmospheres),
    music_styles    = coalesce(dup.music_styles, imp.music_styles)
  where id = imp.id;

  if dup.id is not null then
    delete from public.vendors where id = dup.id;
  end if;

  update public.vendor_claim_requests
    set status = 'validee', decided_at = now(), decided_by = auth.uid()
    where id = r.id;
  -- Les autres demandes en attente sur la même fiche sont refusées.
  update public.vendor_claim_requests
    set status = 'refusee', decided_at = now(), decided_by = auth.uid(),
        motif_refus = 'Fiche rattachée à un autre compte.'
    where imported_vendor_id = imp.id and status = 'en_attente';
end;
$$;

-- ─── 4. Refus (admin) ───────────────────────────────────────────────────
create or replace function public.reject_vendor_claim(p_request_id uuid, p_motif text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;
  update public.vendor_claim_requests
    set status = 'refusee', decided_at = now(), decided_by = auth.uid(),
        motif_refus = nullif(trim(p_motif), '')
    where id = p_request_id and status = 'en_attente';
end;
$$;

revoke all on function public.approve_vendor_claim(uuid) from public, anon;
revoke all on function public.reject_vendor_claim(uuid, text) from public, anon;
grant execute on function public.approve_vendor_claim(uuid) to authenticated;
grant execute on function public.reject_vendor_claim(uuid, text) to authenticated;

-- ─── 5. Ancienneté de l'entreprise (date de création, source Sirene) ────
-- (la colonne afficher_anciennete est créée avant la politique qui la lit)
alter table public.vendor_profiles
  add column if not exists afficher_anciennete boolean not null default false;

-- Stockée à part : jamais saisie par le prestataire (aucune politique
-- d'écriture : seule la tâche serveur, en clé service, l'écrit à partir de
-- l'API officielle recherche-entreprises.api.gouv.fr). Lecture : admin et
-- le prestataire propriétaire de la fiche. Affichage public seulement si
-- la fiche est réclamée ET que le prestataire l'a accepté
-- (vendor_profiles.afficher_anciennete).
create table if not exists public.vendor_company_info (
  vendor_id uuid primary key references public.vendors(id) on delete cascade,
  date_creation date,
  source text not null default 'recherche-entreprises.api.gouv.fr',
  fetched_at timestamptz not null default now()
);
alter table public.vendor_company_info enable row level security;
drop policy if exists "company_info_read" on public.vendor_company_info;
create policy "company_info_read" on public.vendor_company_info
  for select using (
    public.is_admin()
    or exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid())
    -- Public : seulement fiche réclamée + accord du prestataire.
    or exists (
      select 1 from public.vendors v
      join public.vendor_profiles vp on vp.id = v.user_id
      where v.id = vendor_id and v.claim_status = 'reclamee' and vp.afficher_anciennete
    )
  );
