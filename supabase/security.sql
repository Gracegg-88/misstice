-- ============================================================================
--  Misstice — DURCISSEMENT SÉCURITÉ (RLS / triggers / privilèges colonnes)
--  À exécuter dans Supabase → SQL Editor → Run, APRÈS tous les autres scripts.
--  Idempotent. Corrige : C1, C2, E1, E2, E3 de l'audit.
-- ============================================================================

set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────────
-- C1 — Le rôle ne doit JAMAIS venir des métadonnées client pour 'admin'.
--      On assainit : seuls 'particulier' / 'prestataire' sont acceptés au
--      signup ; toute autre valeur (dont 'admin') retombe sur 'particulier'.
--      (Définition autoritaire de handle_new_user — remplace celles de
--       schema.sql et pro.sql.)
-- ─────────────────────────────────────────────────────────────────────────
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
  end if;

  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- C2 — Un utilisateur ne peut pas changer son propre rôle (auto-promotion).
--      On fige la colonne role sur UPDATE pour tout le monde SAUF les admins.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.freeze_profile_role()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() and new.role is distinct from old.role then
    new.role := old.role; -- toute tentative de changement est ignorée
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_freeze_role on public.profiles;
create trigger profiles_freeze_role
  before update on public.profiles
  for each row execute function public.freeze_profile_role();

-- ─────────────────────────────────────────────────────────────────────────
-- E1 — Le propriétaire d'une fiche ne doit pas pouvoir se marquer 'verified'
--      ni gonfler rating/reviews/position/response_*. On fige ces colonnes
--      pour les non-admins. Le calcul auto des notes (trigger SECURITY
--      DEFINER refresh_vendor_rating) est autorisé via un drapeau de session.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.refresh_vendor_rating()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  perform set_config('misstice.rating_sync', 'on', true);
  update public.vendors
    set rating = coalesce(
          (select round(avg(rating)::numeric, 1) from public.reviews where vendor_id = v),
          0
        ),
        reviews = (select count(*) from public.reviews where vendor_id = v)
    where id = v;
  return coalesce(new, old);
end;
$$;

create or replace function public.protect_vendor_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  -- Colonnes de confiance / classement : jamais modifiables par le propriétaire.
  new.verified       := old.verified;
  new.position       := old.position;
  new.response_rate  := old.response_rate;
  new.response_hours := old.response_hours;
  -- rating / reviews : seulement le recalcul automatique (drapeau) y touche.
  if current_setting('misstice.rating_sync', true) is distinct from 'on' then
    new.rating  := old.rating;
    new.reviews := old.reviews;
  end if;
  return new;
end;
$$;

drop trigger if exists vendors_protect_update on public.vendors;
create trigger vendors_protect_update
  before update on public.vendors
  for each row execute function public.protect_vendor_columns();

create or replace function public.protect_vendor_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.verified := false;
    new.rating   := 0;
    new.reviews  := 0;
  end if;
  return new;
end;
$$;

drop trigger if exists vendors_protect_insert on public.vendors;
create trigger vendors_protect_insert
  before insert on public.vendors
  for each row execute function public.protect_vendor_insert();

-- ─────────────────────────────────────────────────────────────────────────
-- E2 — Un participant qui N'EST PAS le prestataire (la famille) ne peut
--      modifier QUE le statut du devis, pas le contenu contractuel.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.protect_quote_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is distinct from new.prestataire_id then
    -- Gèle tout sauf status (et id).
    new.prestataire_id  := old.prestataire_id;
    new.conversation_id := old.conversation_id;
    new.client_name     := old.client_name;
    new.event_label     := old.event_label;
    new.amount          := old.amount;
    new.created_at      := old.created_at;
    new.quote_number    := old.quote_number;
    new.validity_days   := old.validity_days;
    new.intro_message   := old.intro_message;
    new.event_need      := old.event_need;
    new.event_date      := old.event_date;
    new.event_location  := old.event_location;
    new.guests_count    := old.guests_count;
    new.client_email    := old.client_email;
    new.client_phone    := old.client_phone;
    new.client_address  := old.client_address;
    new.service_fee     := old.service_fee;
    new.tax_rate        := old.tax_rate;
    new.items           := old.items;
    new.presta_name     := old.presta_name;
    new.presta_category := old.presta_category;
    new.presta_email    := old.presta_email;
    new.presta_phone    := old.presta_phone;
    new.presta_address  := old.presta_address;
  end if;
  return new;
end;
$$;

drop trigger if exists quotes_protect_update on public.quotes;
create trigger quotes_protect_update
  before update on public.quotes
  for each row execute function public.protect_quote_columns();

-- Bornage du statut (colonne 'status' ajoutée hors CHECK dans messaging.sql).
alter table public.conversations
  drop constraint if exists conversations_status_check;
alter table public.conversations
  add constraint conversations_status_check
  check (status is null or status in ('Nouvelle', 'Devis envoyé', 'Acceptée', 'Refusée'));

-- ─────────────────────────────────────────────────────────────────────────
-- E3 — Bucket 'inspiration' : les chemins sont `<event_id>/…`. On restreint
--      l'écriture/suppression aux membres de l'événement concerné (plus de
--      suppression inter-comptes). Le 1er segment doit être un UUID d'event
--      auquel l'utilisateur a accès.
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "inspiration_write" on storage.objects;
create policy "inspiration_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'inspiration'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.can_access_event(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "inspiration_delete" on storage.objects;
create policy "inspiration_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'inspiration'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.can_access_event(((storage.foldername(name))[1])::uuid)
  );

-- ─────────────────────────────────────────────────────────────────────────
-- M4 — Les disponibilités (dont la note privée) ne doivent pas être publiques.
--      Lecture réservée au prestataire propriétaire.
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "availability_read" on public.vendor_availability;
create policy "availability_read" on public.vendor_availability
  for select using (prestataire_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- M5 — Une conversation : identités + demande immuables après création
--      (un participant ne peut réassigner les IDs ni altérer la demande).
--      + WITH CHECK sur la policy d'update.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.protect_conversation_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new.particulier_id   := old.particulier_id;
  new.prestataire_id   := old.prestataire_id;
  new.vendor_id        := old.vendor_id;
  new.particulier_name := old.particulier_name;
  new.demande          := old.demande;
  new.created_at       := old.created_at;
  return new;
end;
$$;

drop trigger if exists conversations_protect_update on public.conversations;
create trigger conversations_protect_update
  before update on public.conversations
  for each row execute function public.protect_conversation_columns();

drop policy if exists "conv_update" on public.conversations;
create policy "conv_update" on public.conversations
  for update using (auth.uid() in (particulier_id, prestataire_id))
  with check (auth.uid() in (particulier_id, prestataire_id));

-- ─────────────────────────────────────────────────────────────────────────
-- M6 — Avis : n'autoriser que les particuliers ayant réellement contacté le
--      prestataire (une conversation existe) ; le nom d'auteur est dérivé du
--      profil (pas de nom fourni par le client → anti-usurpation).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_review_author()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new.author_id := auth.uid();
  select coalesce(nullif(full_name, ''), 'Client')
    into new.author_name
    from public.profiles where id = auth.uid();
  return new;
end;
$$;

drop trigger if exists reviews_set_author on public.reviews;
create trigger reviews_set_author
  before insert on public.reviews
  for each row execute function public.set_review_author();

drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'particulier'
    )
    and exists (
      select 1
      from public.conversations c
      join public.vendors v on v.id = vendor_id
      where c.particulier_id = auth.uid()
        and c.prestataire_id = v.user_id
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- M1 — guest_rsvp_info ne doit PAS exposer l'email de l'organisateur à anon.
--      (Redéfinition sans organizer_email — remplace event-details.sql.)
-- ─────────────────────────────────────────────────────────────────────────
drop function if exists public.guest_rsvp_info(uuid);
create or replace function public.guest_rsvp_info(p_guest_id uuid)
returns table (
  guest_name text,
  event_name text,
  status     text,
  event_date date,
  event_time text,
  location   text,
  dress_code text,
  plus_one   boolean
)
language sql security definer set search_path = public stable
as $$
  select g.name, e.name, g.status,
         e.event_date, e.event_time, e.location, e.dress_code, g.plus_one
  from public.guests g
  join public.events e on e.id = g.event_id
  where g.id = p_guest_id;
$$;
grant execute on function public.guest_rsvp_info(uuid) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- É1 — vendor_profiles.verified ne doit pas être auto-décernable (badge).
--      On gèle la colonne pour les non-admins (calqué sur vendors).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.protect_vendor_profile_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.verified := old.verified;
  end if;
  return new;
end;
$$;

drop trigger if exists vendor_profiles_protect_update on public.vendor_profiles;
create trigger vendor_profiles_protect_update
  before update on public.vendor_profiles
  for each row execute function public.protect_vendor_profile_columns();

-- ─────────────────────────────────────────────────────────────────────────
-- C2 — event_vendors.vendor_id doit référencer vendors(id) (annuaire), pas
--      vendor_profiles : sinon toute réservation depuis une fiche échoue (FK).
-- ─────────────────────────────────────────────────────────────────────────
alter table public.event_vendors
  drop constraint if exists event_vendors_vendor_id_fkey;
alter table public.event_vendors
  add constraint event_vendors_vendor_id_fkey
  foreign key (vendor_id) references public.vendors (id) on delete set null;

-- É2 — bucket 'inspiration' : conservé PUBLIC (cohérent avec Cloudinary, aussi
--      public par URL) pour ne pas casser l'affichage des images. L'écriture
--      et la suppression restent scopées aux membres (voir dashboard.sql).
update storage.buckets set public = true where id = 'inspiration';
drop policy if exists "inspiration_read" on storage.objects;
create policy "inspiration_read" on storage.objects
  for select using (bucket_id = 'inspiration');

-- ─────────────────────────────────────────────────────────────────────────
-- M — profile_views : le viewer_id ne doit jamais être fourni par le client
--      (sinon vues falsifiables). On force l'identité réelle de l'appelant.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_profile_view_viewer()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new.viewer_id := auth.uid(); -- null si anonyme, jamais une valeur arbitraire
  return new;
end;
$$;

drop trigger if exists profile_views_set_viewer on public.profile_views;
create trigger profile_views_set_viewer
  before insert on public.profile_views
  for each row execute function public.set_profile_view_viewer();

-- ─────────────────────────────────────────────────────────────────────────
-- M — Une dépense doit appartenir à une catégorie DU MÊME événement
--      (sinon pollution inter-événement via un category_id d'un autre event).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.check_expense_category()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.budget_categories c
    where c.id = new.category_id and c.event_id = new.event_id
  ) then
    raise exception 'La catégorie n''appartient pas à cet événement.';
  end if;
  return new;
end;
$$;

drop trigger if exists budget_expenses_check_cat on public.budget_expenses;
create trigger budget_expenses_check_cat
  before insert or update on public.budget_expenses
  for each row execute function public.check_expense_category();

-- Fin.
