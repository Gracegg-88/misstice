-- ============================================================================
--  Misstice — Espace prestataire : devis, formules, book, disponibilités, vues.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql, vendors.sql, messaging.sql.
-- ============================================================================

set check_function_bodies = off;

-- 1. QUOTES — devis envoyés par le prestataire ─────────────────────────────
create table if not exists public.quotes (
  id              uuid primary key default gen_random_uuid(),
  prestataire_id  uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  client_name     text,
  event_label     text,
  amount          numeric not null,
  status          text not null default 'envoyé'
                  check (status in ('envoyé', 'accepté', 'refusé', 'expiré')),
  created_at      timestamptz not null default now()
);
create index if not exists quotes_prestataire_idx on public.quotes (prestataire_id);
create index if not exists quotes_conversation_idx on public.quotes (conversation_id);

alter table public.quotes enable row level security;

drop policy if exists "quotes_select" on public.quotes;
create policy "quotes_select" on public.quotes
  for select using (
    prestataire_id = auth.uid()
    or (conversation_id is not null and public.is_conversation_participant(conversation_id))
  );

drop policy if exists "quotes_insert" on public.quotes;
create policy "quotes_insert" on public.quotes
  for insert with check (prestataire_id = auth.uid());

-- SÉCURITÉ (CRIT-1) : SEUL le prestataire propriétaire peut UPDATE directement
-- sa fiche devis (avec WITH CHECK pour empêcher de réassigner prestataire_id).
-- La famille NE modifie PAS la table en direct — elle change UNIQUEMENT le
-- statut via la RPC set_quote_status ci-dessous (accepté/refusé), ce qui
-- interdit toute falsification de montant / lignes / TVA côté client.
drop policy if exists "quotes_update" on public.quotes;
create policy "quotes_update" on public.quotes
  for update using (prestataire_id = auth.uid())
  with check (prestataire_id = auth.uid());

-- RPC : la famille (participante à la conversation du devis) accepte ou refuse.
-- N'écrit QUE la colonne status ; aucune autre colonne n'est touchée.
create or replace function public.set_quote_status(p_quote uuid, p_status text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_conv uuid;
begin
  if p_status not in ('accepté', 'refusé') then
    return false;
  end if;
  select conversation_id into v_conv from public.quotes where id = p_quote;
  if v_conv is null or not public.is_conversation_participant(v_conv) then
    return false;
  end if;
  update public.quotes set status = p_status where id = p_quote;
  return found;
end;
$$;
grant execute on function public.set_quote_status(uuid, text) to authenticated;

drop policy if exists "quotes_delete" on public.quotes;
create policy "quotes_delete" on public.quotes
  for delete using (prestataire_id = auth.uid());

-- 2. VENDOR_PACKAGES — formules & tarifs (affichées sur la fiche) ───────────
create table if not exists public.vendor_packages (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references public.vendor_profiles (id) on delete cascade,
  name       text not null,
  price      text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
-- Prestations détaillées (puces) + mise en avant « Le plus demandé ».
alter table public.vendor_packages
  add column if not exists features text[] not null default '{}',
  add column if not exists popular boolean not null default false;
create index if not exists vendor_packages_vendor_idx on public.vendor_packages (vendor_id);
alter table public.vendor_packages enable row level security;
drop policy if exists "packages_read" on public.vendor_packages;
create policy "packages_read" on public.vendor_packages for select using (true);
drop policy if exists "packages_write" on public.vendor_packages;
create policy "packages_write" on public.vendor_packages
  for all using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());

-- 3. VENDOR_PHOTOS — book photo ─────────────────────────────────────────────
create table if not exists public.vendor_photos (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references public.vendor_profiles (id) on delete cascade,
  url        text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists vendor_photos_vendor_idx on public.vendor_photos (vendor_id);
alter table public.vendor_photos enable row level security;
drop policy if exists "photos_read" on public.vendor_photos;
create policy "photos_read" on public.vendor_photos for select using (true);
drop policy if exists "photos_write" on public.vendor_photos;
create policy "photos_write" on public.vendor_photos
  for all using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('vendor-photos', 'vendor-photos', true)
on conflict (id) do nothing;
drop policy if exists "vendor_photos_read" on storage.objects;
create policy "vendor_photos_read" on storage.objects
  for select using (bucket_id = 'vendor-photos');
drop policy if exists "vendor_photos_insert" on storage.objects;
create policy "vendor_photos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vendor-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "vendor_photos_delete" on storage.objects;
create policy "vendor_photos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vendor-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. VENDOR_AVAILABILITY — calendrier de disponibilités ─────────────────────
create table if not exists public.vendor_availability (
  id             uuid primary key default gen_random_uuid(),
  prestataire_id uuid not null references public.profiles (id) on delete cascade,
  date           date not null,
  status         text not null default 'pending'
                 check (status in ('booked', 'pending', 'blocked')),
  created_at     timestamptz not null default now(),
  unique (prestataire_id, date)
);
-- Note libre du prestataire sur une journée (affichée dans le panneau détail).
alter table public.vendor_availability add column if not exists note text;
-- « available » = jour explicitement marqué disponible (pastille verte).
alter table public.vendor_availability
  drop constraint if exists vendor_availability_status_check;
alter table public.vendor_availability
  add constraint vendor_availability_status_check
  check (status in ('available', 'booked', 'pending', 'blocked'));
create index if not exists availability_prestataire_idx on public.vendor_availability (prestataire_id);
alter table public.vendor_availability enable row level security;
drop policy if exists "availability_read" on public.vendor_availability;
create policy "availability_read" on public.vendor_availability for select using (true);
drop policy if exists "availability_write" on public.vendor_availability;
create policy "availability_write" on public.vendor_availability
  for all using (prestataire_id = auth.uid()) with check (prestataire_id = auth.uid());

-- 5. PROFILE_VIEWS — vues de la fiche (statistiques) ───────────────────────
create table if not exists public.profile_views (
  id        uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  viewer_id uuid references public.profiles (id) on delete set null,
  viewed_at timestamptz not null default now()
);
create index if not exists profile_views_vendor_idx on public.profile_views (vendor_id, viewed_at);
alter table public.profile_views enable row level security;
-- N'importe qui peut enregistrer une vue.
drop policy if exists "views_insert" on public.profile_views;
create policy "views_insert" on public.profile_views for insert with check (true);
-- Seul le prestataire propriétaire lit ses vues.
drop policy if exists "views_select_owner" on public.profile_views;
create policy "views_select_owner" on public.profile_views
  for select using (
    exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = auth.uid())
  );

-- 6. Inscription prestataire : créer la fiche automatiquement (via trigger)
--    à partir des métadonnées, même si la confirmation d'email est active
--    (pas de session côté client → l'insert client échouerait sinon).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role     text;
  v_company  text;
  v_category text;
  v_city     text;
begin
  v_role := coalesce(new.raw_user_meta_data ->> 'role', 'particulier');
  -- Anti-escalade : jamais 'admin' depuis les métadonnées client.
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
  end if;

  return new;
end;
$$;

-- Fin.
