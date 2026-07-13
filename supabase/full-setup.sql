-- ============================================================================
--  Misstice — INSTALLATION COMPLETE (tous les scripts en un seul fichier).
--  A executer dans Supabase -> SQL Editor -> Run sur un projet NEUF.
--  Concatenation dans l'ordre de dependances. Idempotent.
--  Inclut super-admin.sql (infra admin). Exclut demo-cleanup.sql (destructif).
--  ENSUITE : creer les buckets storage 'avatars', 'vendor-photos', 'inspiration',
--  puis lancer make-admin.sql APRES la creation du compte admin.
-- ============================================================================


-- ####################################################################
-- ###  SOURCE : schema.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Schéma de base de données (Supabase / PostgreSQL)
-- ----------------------------------------------------------------------------
--  À exécuter dans : Supabase Dashboard → SQL Editor → New query → Run.
--  Idempotent : peut être relancé sans casser l'existant.
-- ============================================================================

-- Autorise une fonction à référencer une table définie plus bas dans le script
-- (ex. can_access_event → event_members). N'affecte que cette session.
set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────────
--  1. PROFILES — étend auth.users avec le nom et le rôle
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       text not null default 'particulier'
             check (role in ('particulier', 'prestataire')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Création automatique du profil à l'inscription (lit les métadonnées).
-- SÉCURITÉ : le rôle vient de métadonnées client → on n'accepte JAMAIS 'admin'
-- ici (anti-escalade), indépendamment de l'ordre d'exécution des scripts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'particulier');
begin
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────
--  2. VENDOR_PROFILES — fiche prestataire (rôle 'prestataire')
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.vendor_profiles (
  id         uuid primary key references public.profiles (id) on delete cascade,
  company    text not null,
  category   text,
  city       text,
  about      text,
  created_at timestamptz not null default now()
);

alter table public.vendor_profiles enable row level security;

drop policy if exists "vendor_public_read" on public.vendor_profiles;
create policy "vendor_public_read" on public.vendor_profiles
  for select using (true);

drop policy if exists "vendor_write_own" on public.vendor_profiles;
create policy "vendor_write_own" on public.vendor_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────────────────
--  3. EVENTS — un événement organisé par une famille
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  name         text not null,
  type         text,
  event_date   date,
  budget_total numeric not null default 0,
  guest_count  integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists events_owner_idx on public.events (owner_id);

alter table public.events enable row level security;

-- Un utilisateur "voit" un événement s'il en est propriétaire OU membre.
create or replace function public.can_access_event(p_event_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id and e.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.event_members m
    where m.event_id = p_event_id and m.user_id = auth.uid()
  );
$$;

drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events
  for select using (public.can_access_event(id));

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = owner_id);

drop policy if exists "events_update_owner" on public.events;
create policy "events_update_owner" on public.events
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "events_delete_owner" on public.events;
create policy "events_delete_owner" on public.events
  for delete using (auth.uid() = owner_id);


-- ─────────────────────────────────────────────────────────────────────────
--  4. EVENT_MEMBERS — équipe / collaborateurs invités sur un événement
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.event_members (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  email      text not null,
  role       text,
  user_id    uuid references public.profiles (id) on delete set null,
  status     text not null default 'invited'
             check (status in ('invited', 'accepted')),
  created_at timestamptz not null default now()
);

create index if not exists event_members_event_idx on public.event_members (event_id);

alter table public.event_members enable row level security;

drop policy if exists "members_select" on public.event_members;
create policy "members_select" on public.event_members
  for select using (public.can_access_event(event_id));

-- Seul le propriétaire de l'événement gère les membres.
drop policy if exists "members_write_owner" on public.event_members;
create policy "members_write_owner" on public.event_members
  for all using (
    exists (select 1 from public.events e
            where e.id = event_id and e.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.events e
            where e.id = event_id and e.owner_id = auth.uid())
  );


-- ─────────────────────────────────────────────────────────────────────────
--  5. BUDGET_CATEGORIES + BUDGET_EXPENSES
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.budget_categories (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  name       text not null,
  budget     numeric not null default 0,
  color      text not null default '#6C3CE1',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists budget_categories_event_idx
  on public.budget_categories (event_id);

alter table public.budget_categories enable row level security;

drop policy if exists "budget_cat_access" on public.budget_categories;
create policy "budget_cat_access" on public.budget_categories
  for all using (public.can_access_event(event_id))
  with check (public.can_access_event(event_id));

create table if not exists public.budget_expenses (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.budget_categories (id) on delete cascade,
  event_id    uuid not null references public.events (id) on delete cascade,
  label       text,
  amount      numeric not null check (amount > 0),
  created_at  timestamptz not null default now()
);

create index if not exists budget_expenses_cat_idx
  on public.budget_expenses (category_id);

alter table public.budget_expenses enable row level security;

drop policy if exists "budget_exp_access" on public.budget_expenses;
create policy "budget_exp_access" on public.budget_expenses
  for all using (public.can_access_event(event_id))
  with check (public.can_access_event(event_id));

-- Catégories de budget par défaut, créées automatiquement avec l'événement.
create or replace function public.seed_budget_categories()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.budget_categories (event_id, name, budget, color, position)
  values
    (new.id, 'Lieu & Salle',            0, '#6C3CE1', 1),
    (new.id, 'Traiteur',                0, '#FF8C42', 2),
    (new.id, 'Photographe / Vidéo',     0, '#10B981', 3),
    (new.id, 'Musique & DJ',            0, '#A855F7', 4),
    (new.id, 'Décoration & Fleurs',     0, '#EC4899', 5),
    (new.id, 'Tenue & Coiffure',        0, '#3B82F6', 6),
    (new.id, 'Faire-part & Papeterie',  0, '#6366F1', 7),
    (new.id, 'Transport',               0, '#F43F5E', 8),
    (new.id, 'Gâteau',                  0, '#F59E0B', 9),
    (new.id, 'Divers',                  0, '#6B7280', 10);
  return new;
end;
$$;

drop trigger if exists on_event_created_seed_budget on public.events;
create trigger on_event_created_seed_budget
  after insert on public.events
  for each row execute function public.seed_budget_categories();


-- ─────────────────────────────────────────────────────────────────────────
--  6. VUE PRATIQUE — catégories avec total dépensé calculé
-- ─────────────────────────────────────────────────────────────────────────
create or replace view public.budget_categories_with_spent
  with (security_invoker = true) as
  select
    c.*,
    coalesce(
      (select sum(e.amount) from public.budget_expenses e
       where e.category_id = c.id), 0
    )::numeric as spent
  from public.budget_categories c;

-- Fin du schéma.


-- ####################################################################
-- ###  SOURCE : profile.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Profil : photo d'avatar (colonne + Storage)
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

-- 1. Colonne avatar_url sur les profils
alter table public.profiles
  add column if not exists avatar_url text;

-- 2. Bucket Storage public pour les avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Policies Storage : lecture publique, chaque utilisateur gère son dossier
--    (chemin attendu : avatars/<user_id>/fichier.png)
drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Fin.


-- ####################################################################
-- ###  SOURCE : admin.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Extension ADMIN (rôle admin + lecture globale sécurisée)
-- ----------------------------------------------------------------------------
--  À exécuter dans : Supabase Dashboard → SQL Editor → New query → Run.
--  À lancer APRÈS supabase/schema.sql. Idempotent.
-- ============================================================================

-- 1. Autoriser le rôle 'admin' sur les profils
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('particulier', 'prestataire', 'admin'));

-- 2. Statut de vérification sur les fiches prestataires (pour la modération)
alter table public.vendor_profiles
  add column if not exists verified boolean not null default false;

-- 3. Helper : l'utilisateur courant est-il admin ?
--    SECURITY DEFINER → contourne le RLS (évite la récursion sur profiles).
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 4. Politiques de lecture globale réservées aux admins
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read" on public.profiles
  for select using (public.is_admin());

-- Confidentialité : les événements (et leurs dépenses) ne sont visibles QUE des
-- personnes concernées (propriétaire + membres acceptés). L'admin n'a PAS accès
-- au détail — seulement à des compteurs agrégés (fonctions ci-dessous).
drop policy if exists "events_admin_read" on public.events;
drop policy if exists "budget_expenses_admin_read" on public.budget_expenses;

-- Compteur agrégé d'événements pour les stats admin (aucun détail exposé).
create or replace function public.admin_events_count()
returns integer
language sql security definer set search_path = public stable
as $$
  select case
    when public.is_admin() then (select count(*)::int from public.events)
    else 0
  end;
$$;
grant execute on function public.admin_events_count() to authenticated;

-- Horodatages de création (pour le graphe d'activité) — sans nom/budget/invités.
create or replace function public.admin_events_created_since(p_since timestamptz)
returns setof timestamptz
language sql security definer set search_path = public stable
as $$
  select created_at from public.events
  where public.is_admin() and created_at >= p_since;
$$;
grant execute on function public.admin_events_created_since(timestamptz) to authenticated;

-- 5. CATÉGORIES DE PRESTATAIRE — gérées depuis l'admin
create table if not exists public.vendor_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.vendor_categories enable row level security;

drop policy if exists "vendor_categories_read" on public.vendor_categories;
create policy "vendor_categories_read" on public.vendor_categories
  for select using (true);

drop policy if exists "vendor_categories_admin_write" on public.vendor_categories;
create policy "vendor_categories_admin_write" on public.vendor_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed : les catégories actuelles
insert into public.vendor_categories (name, position) values
  ('Photographe', 1), ('DJ & Sono', 2), ('Traiteur', 3), ('Décoration', 4),
  ('Salle de réception', 5), ('Pâtissier', 6), ('Wedding planner', 7), ('Fleuriste', 8)
on conflict (name) do nothing;

-- 6. LISTE DES UTILISATEURS pour l'admin : voir la section 10 (version enrichie
--    avec l'état "banni"). L'ancienne définition à 5 colonnes est supprimée ici
--    pour éviter le conflit « cannot change return type » au re-run.

-- 7. Écriture admin sur les fiches prestataires (vérifier / suspendre / retirer)
drop policy if exists "vendor_profiles_admin_update" on public.vendor_profiles;
create policy "vendor_profiles_admin_update" on public.vendor_profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "vendor_profiles_admin_delete" on public.vendor_profiles;
create policy "vendor_profiles_admin_delete" on public.vendor_profiles
  for delete using (public.is_admin());

-- 8. SIGNALEMENTS
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('prestataire', 'avis', 'utilisateur')),
  target_ref  text,
  reason      text,
  status      text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at  timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "reports_admin_all" on public.reports;
create policy "reports_admin_all" on public.reports
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);

-- 9. Pour te promouvoir admin, exécute (en remplaçant l'email) :
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'ton@email.com');

-- ─────────────────────────────────────────────────────────────────────────
-- 10. GESTION DES COMPTES (rôle / bannissement / suppression) — M17.
--     Toutes gardées par is_admin() et interdisant l'auto-ciblage (anti-lock-out).
-- ─────────────────────────────────────────────────────────────────────────

-- Liste enrichie : ajoute l'état "banni".
drop function if exists public.admin_list_users();
create or replace function public.admin_list_users()
returns table (
  id uuid,
  full_name text,
  role text,
  email text,
  created_at timestamptz,
  banned boolean
)
language sql security definer set search_path = public stable
as $$
  select p.id, p.full_name, p.role, u.email::text, p.created_at,
         (u.banned_until is not null and u.banned_until > now()) as banned
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;
grant execute on function public.admin_list_users() to authenticated;

-- Changer le rôle d'un compte : VOLONTAIREMENT RETIRÉ. Un admin ne doit pas
-- pouvoir transformer un particulier en prestataire (ou inversement). La gestion
-- admin ↔ super-admin passe par super-admin.sql (sadmin_promote / revoke / manage).
drop function if exists public.admin_set_role(uuid, text);

-- Bannir / débannir (bloque la connexion via auth.users.banned_until).
create or replace function public.admin_set_banned(p_target uuid, p_banned boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Impossible de se bannir soi-même';
  end if;
  update auth.users
    set banned_until = case when p_banned then now() + interval '100 years' else null end
    where id = p_target;
end;
$$;
grant execute on function public.admin_set_banned(uuid, boolean) to authenticated;

-- Supprimer définitivement un compte (cascade profiles/events/vendors…).
create or replace function public.admin_delete_user(p_target uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Impossible de supprimer son propre compte';
  end if;
  delete from auth.users where id = p_target;
end;
$$;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- Fin.


-- ####################################################################
-- ###  SOURCE : super-admin.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Super-admin & gestion des administrateurs.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de admin.sql (is_admin, admin_set_role…).
--
--  • Un « super-admin » (can_manage_admins = true) peut inviter / gérer les
--    autres administrateurs.
--  • Le(s) admin(s) actuel(s) sont promus super-admin par cette migration.
-- ============================================================================

set check_function_bodies = off;

-- 1. Drapeau super-admin sur les profils.
alter table public.profiles
  add column if not exists can_manage_admins boolean not null default false;

-- 2. Les administrateurs EXISTANTS deviennent super-admins.
update public.profiles set can_manage_admins = true where role = 'admin';

-- 3. Helper : l'utilisateur courant est-il super-admin ?
create or replace function public.is_super_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and can_manage_admins = true
  );
$$;

-- 4. Liste des administrateurs (email + état) — réservée aux super-admins.
create or replace function public.admin_list_admins()
returns table (
  id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  banned boolean,
  can_manage_admins boolean
)
language sql security definer set search_path = public stable
as $$
  select p.id, p.full_name, u.email::text, p.created_at,
         (u.banned_until is not null and u.banned_until > now()) as banned,
         p.can_manage_admins
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_super_admin() and p.role = 'admin'
  order by p.created_at asc;
$$;
grant execute on function public.admin_list_admins() to authenticated;

-- 5. Promouvoir un compte en administrateur (utilisé après création du compte
--    invité). Réservé aux super-admins ; interdit l'auto-ciblage.
create or replace function public.sadmin_promote(p_target uuid, p_can_manage boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Action impossible sur son propre compte';
  end if;
  update public.profiles
    set role = 'admin', can_manage_admins = coalesce(p_can_manage, false)
    where id = p_target;
end;
$$;
grant execute on function public.sadmin_promote(uuid, boolean) to authenticated;

-- 6. Accorder / retirer le droit de gérer les admins.
create or replace function public.sadmin_set_manage(p_target uuid, p_can_manage boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Action impossible sur son propre compte';
  end if;
  update public.profiles set can_manage_admins = coalesce(p_can_manage, false)
    where id = p_target and role = 'admin';
end;
$$;
grant execute on function public.sadmin_set_manage(uuid, boolean) to authenticated;

-- 7. Retirer les droits d'administration (repasse en particulier).
create or replace function public.sadmin_revoke_admin(p_target uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Action impossible sur son propre compte';
  end if;
  update public.profiles set role = 'particulier', can_manage_admins = false
    where id = p_target;
end;
$$;
grant execute on function public.sadmin_revoke_admin(uuid) to authenticated;

-- 7b. On retire l'ancien changeur de rôle générique : un admin ne doit PAS
--     pouvoir transformer un particulier en prestataire (ou inversement).
--     Les seuls changements de rôle autorisés passent par les fonctions
--     super-admin ci-dessus (promotion / révocation d'administrateur).
drop function if exists public.admin_set_role(uuid, text);

-- 8. Suspendre / réactiver un administrateur (bloque la connexion).
create or replace function public.sadmin_set_banned(p_target uuid, p_banned boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Action impossible sur son propre compte';
  end if;
  update auth.users
    set banned_until = case when p_banned then now() + interval '100 years' else null end
    where id = p_target;
end;
$$;
grant execute on function public.sadmin_set_banned(uuid, boolean) to authenticated;

-- Fin.


-- ####################################################################
-- ###  SOURCE : vendors.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Table VENDORS (annuaire public des prestataires)
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Nécessite la fonction public.is_admin() (voir supabase/admin.sql).
-- ============================================================================

create table if not exists public.vendors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text not null,
  city           text,
  region         text,
  price_level    integer not null default 2 check (price_level between 1 and 3),
  price_from     text,
  rating         numeric not null default 0,
  reviews        integer not null default 0,
  verified       boolean not null default false,
  response_hours integer not null default 24,
  response_rate  integer not null default 0,
  languages      text[] not null default '{}',
  tagline        text,
  review_snippet text,
  review_author  text,
  grad           text not null default 'from-violet to-festif',
  image          text,
  position       integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists vendors_category_idx on public.vendors (category);
create index if not exists vendors_city_idx on public.vendors (city);

alter table public.vendors enable row level security;

drop policy if exists "vendors_public_read" on public.vendors;
create policy "vendors_public_read" on public.vendors for select using (true);

drop policy if exists "vendors_admin_write" on public.vendors;
create policy "vendors_admin_write" on public.vendors
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed (uniquement si la table est vide, pour ne pas dupliquer)
insert into public.vendors
  (name, category, city, region, price_level, price_from, rating, reviews, verified, response_hours, response_rate, languages, tagline, review_snippet, review_author, grad, image, position)
select * from (values
  ('Studio Lumière', 'Photographe', 'Paris', 'Île-de-France', 2, 'dès 800 €', 4.9, 127, true, 2, 98, ARRAY['Français', 'Anglais']::text[], 'Reportage doux et lumineux, sans poses figées.', 'Des photos qui nous ressemblent vraiment. Présent toute la journée, discret et adorable.', 'Awa, mariée en 2025', 'from-violet to-festif', '/photographe.png', 1),
  ('DJ Sankara', 'DJ & Sono', 'Lyon', 'Auvergne-Rhône-Alpes', 2, 'dès 450 €', 4.8, 94, true, 3, 95, ARRAY['Français', 'Espagnol', 'Anglais']::text[], 'Du coupé-décalé au dancefloor jusqu''à 5h.', NULL, NULL, 'from-festif to-emerald', '/dj.png', 2),
  ('Saveurs Gourmandes', 'Traiteur', 'Marseille', 'PACA', 2, 'dès 35 €/pers', 5, 211, true, 4, 99, ARRAY['Français', 'Arabe', 'Espagnol']::text[], 'Cuisine ouest-africaine et fusion, du buffet au service à l''assiette.', 'Le thiéboudienne était parfait, et le buffet végé a régalé tout le monde.', 'Fatou, baptême 2026', 'from-emerald to-violet', '/traiteur.png', 3),
  ('Atelier Fleur & Co', 'Décoration', 'Bordeaux', 'Nouvelle-Aquitaine', 1, 'dès 600 €', 4.7, 63, false, 6, 88, ARRAY['Français']::text[], 'Scénographie florale bohème et durable.', NULL, NULL, 'from-violet to-emerald', '/decoration.png', 4),
  ('Le Pavillon Royal', 'Salle de réception', 'Toulouse', 'Occitanie', 3, 'dès 2 500 €', 4.9, 158, true, 5, 96, ARRAY['Français', 'Anglais']::text[], 'Domaine avec parc, jusqu''à 250 invités.', 'Cadre magnifique et équipe ultra pro. Aucun stress le jour J.', 'Karim & Léa, 2025', 'from-festif to-violet', '/salle.png', 5),
  ('Douceurs de Maya', 'Pâtissier', 'Nantes', 'Pays de la Loire', 1, 'dès 120 €', 4.8, 88, true, 2, 97, ARRAY['Français', 'Anglais']::text[], 'Wedding cakes et pièces montées sur-mesure.', NULL, NULL, 'from-emerald to-festif', '/patissier.png', 6),
  ('Maison Diallo Events', 'Wedding planner', 'Paris', 'Île-de-France', 3, 'dès 3 000 €', 5, 74, true, 1, 100, ARRAY['Français', 'Anglais', 'Arabe']::text[], 'Organisation clé en main, mariages mixtes et traditionnels.', 'Elle a coordonné une cérémonie franco-sénégalaise sans accroc. Inestimable.', 'Aminata, mariée 2026', 'from-violet to-festif', '/vendor-7.png', 7),
  ('Beat & Bass', 'DJ & Sono', 'Lille', 'Hauts-de-France', 1, 'dès 350 €', 4.5, 41, false, 8, 82, ARRAY['Français']::text[], 'DJ généraliste, ambiance familiale.', NULL, NULL, 'from-festif to-emerald', '/vendor-8.png', 8),
  ('Clic & Clap Vidéo', 'Photographe', 'Strasbourg', 'Grand Est', 2, 'dès 950 €', 4.9, 102, true, 3, 94, ARRAY['Français', 'Anglais', 'Arabe']::text[], 'Photo + film, montage cinématique en 4K.', NULL, NULL, 'from-emerald to-violet', '/vendor-9.png', 9),
  ('Traiteur Le Baobab', 'Traiteur', 'Lille', 'Hauts-de-France', 2, 'dès 28 €/pers', 4.8, 133, true, 5, 93, ARRAY['Français', 'Arabe']::text[], 'Réceptions élégantes, service jusqu''au bout de la nuit.', 'Service impeccable pour 180 invités, jusqu''au bout de la nuit.', 'Mamadou, gala 2025', 'from-festif to-violet', '/vendor-10.png', 10),
  ('Roses & Pivoines', 'Fleuriste', 'Lyon', 'Auvergne-Rhône-Alpes', 2, 'dès 400 €', 4.6, 57, true, 4, 90, ARRAY['Français']::text[], 'Bouquets de saison, fleurs locales.', NULL, NULL, 'from-violet to-emerald', '/vendor-11.png', 11),
  ('Élégance Décor', 'Décoration', 'Paris', 'Île-de-France', 3, 'dès 1 800 €', 4.9, 119, true, 2, 97, ARRAY['Français', 'Anglais']::text[], 'Décors haut de gamme, arches et mises en lumière.', 'Salle transformée, nos invités n''en revenaient pas. Un travail d''orfèvre.', 'Sarah & Yanis, 2026', 'from-emerald to-festif', '/vendor-12.png', 12),
  ('Sweet Macaron', 'Pâtissier', 'Marseille', 'PACA', 1, 'dès 90 €', 4.4, 38, false, 10, 79, ARRAY['Français']::text[], 'Buffet de desserts et candy bar.', NULL, NULL, 'from-festif to-emerald', '/vendor-13.png', 13),
  ('Harmony Weddings', 'Wedding planner', 'Bordeaux', 'Nouvelle-Aquitaine', 2, 'dès 1 500 €', 4.7, 66, true, 3, 92, ARRAY['Français', 'Anglais']::text[], 'Coordination jour J et planification partielle.', NULL, NULL, 'from-violet to-festif', '/vendor-14.png', 14),
  ('Royal Sound System', 'DJ & Sono', 'Paris', 'Île-de-France', 2, 'dès 550 €', 4.8, 110, true, 2, 96, ARRAY['Français', 'Espagnol', 'Anglais']::text[], 'Afrobeats, zouk, RnB — set 100% live mix.', 'Le dancefloor n''a pas désempli. Lecture de la salle parfaite.', 'Grace, mariage 2025', 'from-emerald to-violet', '/vendor-15.png', 15),
  ('Jardin Secret', 'Salle de réception', 'Nantes', 'Pays de la Loire', 2, 'dès 1 600 €', 4.6, 49, true, 6, 89, ARRAY['Français']::text[], 'Orangerie et jardin clos, jusqu''à 120 invités.', NULL, NULL, 'from-festif to-violet', '/vendor-16.png', 16),
  ('Pixel & Or', 'Photographe', 'Toulouse', 'Occitanie', 1, 'dès 650 €', 4.5, 52, false, 7, 85, ARRAY['Français', 'Arabe']::text[], 'Style éditorial, retouche naturelle.', NULL, NULL, 'from-violet to-emerald', '/vendor-17.png', 17),
  ('Lys Blanc Fleurs', 'Fleuriste', 'Nice', 'PACA', 2, 'dès 380 €', 4.7, 44, true, 4, 91, ARRAY['Français', 'Anglais']::text[], 'Compositions modernes et arches fleuries.', NULL, NULL, 'from-emerald to-festif', '/vendor-18.png', 18)
) as v
where not exists (select 1 from public.vendors);

-- Fin.


-- ####################################################################
-- ###  SOURCE : vendor-categories.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Catégories de prestataires (annuaire).
--  Liste complète des métiers qui interviennent dans l'organisation d'un
--  événement (mariage, anniversaire, baptême, gala, séminaire…).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent (on conflict).
--  Nécessite la table public.vendor_categories (voir admin.sql).
-- ============================================================================

insert into public.vendor_categories (name, position) values
  ('Lieu de réception',            1),
  ('Salle des fêtes',              2),
  ('Domaine / Château',            3),
  ('Traiteur',                     4),
  ('Food truck',                   5),
  ('Bar à cocktails / Barman',     6),
  ('Bar à bonbons / Confiseur',    7),
  ('Bar à glaces / Glacier',       8),
  ('Pâtissier / Wedding cake',     9),
  ('Photographe',                  10),
  ('Vidéaste',                     11),
  ('Photobooth / Borne photo',     12),
  ('DJ & Sono',                    13),
  ('Groupe de musique',            14),
  ('Musiciens / Chanteur',         15),
  ('Sonorisation & Technique',     16),
  ('Éclairage',                    17),
  ('Décoration',                   18),
  ('Fleuriste',                    19),
  ('Location de mobilier',         20),
  ('Location de vaisselle',        21),
  ('Location de linge / Nappage',  22),
  ('Location de tentes / Chapiteaux', 23),
  ('Location de sanitaires',       24),
  ('Wedding / Event planner',      25),
  ('Coordinateur jour J',          26),
  ('Officiant de cérémonie',       27),
  ('Animation / Animateur',        28),
  ('Magicien',                     29),
  ('Spectacle / Artistes',         30),
  ('Animations enfants',           31),
  ('Château gonflable',            32),
  ('Baby-sitting / Garde',         33),
  ('Location de jeux',             34),
  ('Casino événementiel',          35),
  ('Feu d''artifice / Pyrotechnie', 36),
  ('Maquilleur(se)',               37),
  ('Coiffeur(se)',                 38),
  ('Robe & Tenue de mariée',       39),
  ('Costume / Habillement',        40),
  ('Bijoux & Accessoires',         41),
  ('Faire-part / Papeterie',       42),
  ('Calligraphe',                  43),
  ('Cadeaux invités',              44),
  ('Transport / Navette',          45),
  ('Voiture de prestige',          46),
  ('Voiturier',                    47),
  ('Hébergement',                  48),
  ('Sécurité / Vigile',            49),
  ('Assurance événement',          50),
  ('Autre',                        51)
on conflict (name) do nothing;

-- Fin.


-- ####################################################################
-- ###  SOURCE : dashboard.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Tables du dashboard particulier (Checklist, Invités,
--  Prestataires réservés, Planning Jour J, Agenda, Inspiration).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (events, can_access_event, event_members…).
-- ============================================================================

set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────────
--  Helper RLS : accès collaboratif (propriétaire OU membre de l'événement)
--  → public.can_access_event(event_id) est défini dans schema.sql.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. CHECKLIST ─────────────────────────────────────────────────────────────
create table if not exists public.checklist_tasks (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  label      text not null,
  assignee   text,
  due_date   date,
  done       boolean not null default false,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists checklist_tasks_event_idx on public.checklist_tasks (event_id);
alter table public.checklist_tasks enable row level security;
drop policy if exists "checklist_access" on public.checklist_tasks;
create policy "checklist_access" on public.checklist_tasks
  for all using (public.can_access_event(event_id))
  with check (public.can_access_event(event_id));

-- 2. INVITÉS ───────────────────────────────────────────────────────────────
create table if not exists public.guests (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  diet        text,
  group_label text,
  status      text not null default 'invité'
              check (status in ('invité', 'en attente', 'confirmé', 'décliné')),
  plus_one    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists guests_event_idx on public.guests (event_id);
alter table public.guests enable row level security;
drop policy if exists "guests_access" on public.guests;
create policy "guests_access" on public.guests
  for all using (public.can_access_event(event_id))
  with check (public.can_access_event(event_id));

-- 3. PRESTATAIRES RÉSERVÉS ─────────────────────────────────────────────────
create table if not exists public.event_vendors (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  -- Fiche de l'annuaire (table vendors), pas vendor_profiles : c'est l'id
  -- utilisé partout côté UI (ajout depuis la fiche, lien « Contacter »).
  vendor_id  uuid references public.vendors (id) on delete set null,
  name       text not null,
  category   text,
  status     text not null default 'en attente'
             check (status in ('confirmé', 'en attente', 'devis reçu')),
  price      numeric,
  created_at timestamptz not null default now()
);
create index if not exists event_vendors_event_idx on public.event_vendors (event_id);
alter table public.event_vendors enable row level security;
drop policy if exists "event_vendors_access" on public.event_vendors;
create policy "event_vendors_access" on public.event_vendors
  for all using (public.can_access_event(event_id))
  with check (public.can_access_event(event_id));

-- 4. PLANNING JOUR J ───────────────────────────────────────────────────────
create table if not exists public.planning_moments (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  start_time  text,
  duration    text,
  title       text not null,
  description text,
  place       text,
  who         text,
  vendor      text,
  color       text not null default '#6C3CE1',
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists planning_moments_event_idx on public.planning_moments (event_id);
alter table public.planning_moments enable row level security;
drop policy if exists "planning_access" on public.planning_moments;
create policy "planning_access" on public.planning_moments
  for all using (public.can_access_event(event_id))
  with check (public.can_access_event(event_id));

-- 5. AGENDA — rendez-vous / appels prestataires ────────────────────────────
create table if not exists public.vendor_calls (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  vendor       text not null,
  scheduled_at timestamptz not null,
  mode         text not null default 'appel'
               check (mode in ('appel', 'visio')),
  created_at   timestamptz not null default now()
);
create index if not exists vendor_calls_event_idx on public.vendor_calls (event_id);
alter table public.vendor_calls enable row level security;
drop policy if exists "vendor_calls_access" on public.vendor_calls;
create policy "vendor_calls_access" on public.vendor_calls
  for all using (public.can_access_event(event_id))
  with check (public.can_access_event(event_id));

-- 6. INSPIRATION — moodboard ───────────────────────────────────────────────
create table if not exists public.inspiration_ideas (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  title      text,
  category   text,
  tags       text[] not null default '{}',
  image_url  text not null,
  source     text,
  liked      boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists inspiration_ideas_event_idx on public.inspiration_ideas (event_id);
alter table public.inspiration_ideas enable row level security;
drop policy if exists "inspiration_access" on public.inspiration_ideas;
create policy "inspiration_access" on public.inspiration_ideas
  for all using (public.can_access_event(event_id))
  with check (public.can_access_event(event_id));

-- Bucket Storage public pour les images d'inspiration importées (comme les
-- URLs Cloudinary, publiques par lien). L'ÉCRITURE/SUPPRESSION reste scopée
-- aux membres de l'événement (chemins `<event_id>/…`).
insert into storage.buckets (id, name, public)
values ('inspiration', 'inspiration', true)
on conflict (id) do update set public = true;

drop policy if exists "inspiration_read" on storage.objects;
create policy "inspiration_read" on storage.objects
  for select using (bucket_id = 'inspiration');

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

-- Fin.


-- ####################################################################
-- ###  SOURCE : messaging.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Messagerie in-app famille ↔ prestataire (devis + discussion).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (profiles, events) et vendors.sql (vendors).
-- ============================================================================

set check_function_bodies = off;

-- 1. Lien fiche annuaire → compte prestataire réel (null = fiche démo).
alter table public.vendors
  add column if not exists user_id uuid references public.profiles (id) on delete set null;

-- Un prestataire peut créer / gérer SA propre fiche (en plus des admins).
drop policy if exists "vendors_owner_write" on public.vendors;
create policy "vendors_owner_write" on public.vendors
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. CONVERSATIONS ─────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  particulier_id  uuid not null references public.profiles (id) on delete cascade, -- la famille
  prestataire_id  uuid not null references public.profiles (id) on delete cascade, -- le prestataire
  vendor_id       uuid references public.vendors (id) on delete set null,          -- fiche (affichage)
  vendor_name     text,
  event_id        uuid references public.events (id) on delete set null,
  subject         text,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
-- Nom du client mémorisé sur la conversation (le prestataire ne peut pas lire
-- le profil du particulier à cause du RLS → on dénormalise à la création).
alter table public.conversations
  add column if not exists particulier_name text;

-- Idem pour la photo de profil du client (affichée côté prestataire).
alter table public.conversations
  add column if not exists particulier_avatar text;

-- Détails de la demande de devis (besoin, date, lieu, invités, coordonnées).
-- Servent à pré-remplir le devis côté prestataire.
alter table public.conversations
  add column if not exists demande jsonb;

-- Statut manuel de la demande (défini par le prestataire depuis le badge).
-- null = statut déduit automatiquement du devis.
alter table public.conversations
  add column if not exists status text;

-- Backfill des conversations existantes (l'éditeur SQL contourne le RLS).
update public.conversations c
  set particulier_name = p.full_name
  from public.profiles p
  where p.id = c.particulier_id
    and (c.particulier_name is null or c.particulier_name = '')
    and coalesce(p.full_name, '') <> '';

-- Backfill des avatars des conversations existantes.
update public.conversations c
  set particulier_avatar = p.avatar_url
  from public.profiles p
  where p.id = c.particulier_id
    and c.particulier_avatar is null
    and coalesce(p.avatar_url, '') <> '';

create index if not exists conversations_particulier_idx on public.conversations (particulier_id);
create index if not exists conversations_prestataire_idx on public.conversations (prestataire_id);

alter table public.conversations enable row level security;

drop policy if exists "conv_select" on public.conversations;
create policy "conv_select" on public.conversations
  for select using (auth.uid() in (particulier_id, prestataire_id));

drop policy if exists "conv_insert" on public.conversations;
create policy "conv_insert" on public.conversations
  for insert with check (auth.uid() = particulier_id);

drop policy if exists "conv_update" on public.conversations;
create policy "conv_update" on public.conversations
  for update using (auth.uid() in (particulier_id, prestataire_id));

-- 3. MESSAGES ──────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

-- Vrai si l'utilisateur courant participe à la conversation.
create or replace function public.is_conversation_participant(p_conv uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conv and auth.uid() in (c.particulier_id, c.prestataire_id)
  );
$$;

drop policy if exists "msg_select" on public.messages;
create policy "msg_select" on public.messages
  for select using (public.is_conversation_participant(conversation_id));

drop policy if exists "msg_insert" on public.messages;
create policy "msg_insert" on public.messages
  for insert with check (
    sender_id = auth.uid() and public.is_conversation_participant(conversation_id)
  );

-- Aperçu du dernier message (affiché dans la liste des conversations).
alter table public.conversations
  add column if not exists last_message text;

-- 4. Bump last_message_at + aperçu à chaque message (SECURITY DEFINER → ignore RLS).
create or replace function public.bump_conversation()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.conversations
    set last_message_at = now(),
        -- On masque le marqueur technique des messages « devis ».
        last_message = case
          when new.body ~ '^\[\[devis:' then '📄 Devis'
          when new.body ~ '^\[\[img:'   then '📷 Photo'
          when new.body ~ '^\[\[vid:'   then '📹 Vidéo'
          when new.body ~ '^\[\[doc:'   then '📎 Document'
          else left(new.body, 120)
        end
    where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute function public.bump_conversation();

-- 5. Temps réel : diffuser les nouveaux messages.
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when others then null;
  end;
end $$;

-- Fin.


-- ####################################################################
-- ###  SOURCE : pro.sql
-- ####################################################################

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

-- Le prestataire OU la famille (via la conversation) peut mettre à jour le statut.
drop policy if exists "quotes_update" on public.quotes;
create policy "quotes_update" on public.quotes
  for update using (
    prestataire_id = auth.uid()
    or (conversation_id is not null and public.is_conversation_participant(conversation_id))
  );

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


-- ####################################################################
-- ###  SOURCE : reviews.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Avis clients (laissés par les particuliers uniquement).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (profiles) et vendors.sql (vendors).
-- ============================================================================

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  author_name text,
  rating      integer not null check (rating between 1 and 5),
  event_type  text,
  body        text,
  created_at  timestamptz not null default now(),
  unique (vendor_id, author_id) -- un seul avis par personne et par prestataire
);
create index if not exists reviews_vendor_idx on public.reviews (vendor_id, created_at desc);

alter table public.reviews enable row level security;

-- Lecture publique (les avis sont affichés sur la fiche).
drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews for select using (true);

-- Seuls les PARTICULIERS peuvent déposer un avis (sur leur propre compte).
drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'particulier'
    )
  );

-- Chacun gère son propre avis.
drop policy if exists "reviews_update" on public.reviews;
create policy "reviews_update" on public.reviews
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "reviews_delete" on public.reviews;
create policy "reviews_delete" on public.reviews
  for delete using (author_id = auth.uid());

-- ── Synchronisation vendors.rating / vendors.reviews ────────────────────────
-- Les cartes de l'annuaire lisent ces colonnes : on les recalcule à chaque
-- avis créé / modifié / supprimé (SECURITY DEFINER pour contourner le RLS).
create or replace function public.refresh_vendor_rating()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  -- Autorise le trigger de protection (security.sql) à laisser passer ce
  -- recalcul automatique de rating/reviews.
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

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_vendor_rating();

-- Backfill : recale les prestataires qui ont déjà des avis.
update public.vendors v
  set rating = r.avg_rating,
      reviews = r.cnt
  from (
    select vendor_id,
           round(avg(rating)::numeric, 1) as avg_rating,
           count(*) as cnt
    from public.reviews
    group by vendor_id
  ) r
  where r.vendor_id = v.id;

-- Fin.


-- ####################################################################
-- ###  SOURCE : notifications.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Notifications in-app (cloche + temps réel).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql, messaging.sql, pro.sql.
-- ============================================================================

set check_function_bodies = off;

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade, -- destinataire
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Chacun ne voit / ne gère QUE ses notifications.
drop policy if exists "notif_select" on public.notifications;
create policy "notif_select" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notif_update" on public.notifications;
create policy "notif_update" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notif_delete" on public.notifications;
create policy "notif_delete" on public.notifications
  for delete using (user_id = auth.uid());
-- Pas d'INSERT côté client : seules les fonctions SECURITY DEFINER ci-dessous
-- créent des notifications (on notifie un AUTRE utilisateur).

-- Helper interne.
create or replace function public.push_notification(
  p_user uuid, p_type text, p_title text, p_body text, p_link text
)
returns void
language sql security definer set search_path = public
as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user, p_type, p_title, p_body, p_link);
$$;

-- ── 1. Nouveau message → notifie l'AUTRE participant ────────────────────────
create or replace function public.notify_new_message()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  c public.conversations%rowtype;
  v_recipient uuid;
  v_link text;
begin
  -- Les messages « devis » sont couverts par notify_new_quote.
  if new.body ~ '^\[\[devis:' then
    return new;
  end if;
  select * into c from public.conversations where id = new.conversation_id;
  if not found then return new; end if;

  if new.sender_id = c.particulier_id then
    v_recipient := c.prestataire_id;
    v_link := '/pro/messagerie/' || c.id;
  else
    v_recipient := c.particulier_id;
    v_link := '/dashboard/messages/' || c.id;
  end if;

  perform public.push_notification(
    v_recipient, 'message', 'Nouveau message',
    left(new.body, 90), v_link
  );
  return new;
end;
$$;

drop trigger if exists on_message_notify on public.messages;
create trigger on_message_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- ── 2. Nouvelle conversation (demande) → notifie le prestataire ─────────────
create or replace function public.notify_new_conversation()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.push_notification(
    new.prestataire_id, 'demande', 'Nouvelle demande de devis',
    coalesce(new.particulier_name, 'Un client') || ' vous a contacté.',
    '/pro/demandes'
  );
  return new;
end;
$$;

drop trigger if exists on_conversation_notify on public.conversations;
create trigger on_conversation_notify
  after insert on public.conversations
  for each row execute function public.notify_new_conversation();

-- ── 3. Nouveau devis → notifie le client ────────────────────────────────────
create or replace function public.notify_new_quote()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_client uuid;
begin
  if new.conversation_id is null then return new; end if;
  select particulier_id into v_client
    from public.conversations where id = new.conversation_id;
  if v_client is null then return new; end if;

  perform public.push_notification(
    v_client, 'devis', 'Vous avez reçu un devis',
    coalesce(new.quote_number, 'Devis') || ' — ' ||
      to_char(new.amount, 'FM999G999G990D00') || ' €',
    '/devis/' || new.id
  );
  return new;
end;
$$;

drop trigger if exists on_quote_notify on public.quotes;
create trigger on_quote_notify
  after insert on public.quotes
  for each row execute function public.notify_new_quote();

-- ── 4. Devis accepté / refusé → notifie le prestataire ──────────────────────
create or replace function public.notify_quote_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = old.status then return new; end if;
  if new.status = 'accepté' then
    perform public.push_notification(
      new.prestataire_id, 'devis_accepte', 'Devis accepté 🎉',
      coalesce(new.client_name, 'Le client') || ' a accepté votre devis.',
      '/devis/' || new.id
    );
  elsif new.status = 'refusé' then
    perform public.push_notification(
      new.prestataire_id, 'devis_refuse', 'Devis refusé',
      coalesce(new.client_name, 'Le client') || ' a refusé votre devis.',
      '/devis/' || new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_quote_status_notify on public.quotes;
create trigger on_quote_status_notify
  after update of status on public.quotes
  for each row execute function public.notify_quote_status();

-- 5. Temps réel.
do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when others then null;
  end;
end $$;

-- Fin.


-- ####################################################################
-- ###  SOURCE : security.sql
-- ####################################################################

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
  -- Identités et date de création : toujours immuables.
  new.particulier_id := old.particulier_id;
  new.prestataire_id := old.prestataire_id;
  new.vendor_id      := old.vendor_id;
  new.created_at     := old.created_at;
  -- La demande et le nom du client ne sont modifiables que par le CLIENT
  -- lui-même (nouvelle demande dans la même conversation) ; le prestataire ne
  -- peut pas les altérer.
  if auth.uid() is distinct from old.particulier_id then
    new.demande            := old.demande;
    new.particulier_name   := old.particulier_name;
    new.particulier_avatar := old.particulier_avatar;
  end if;
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


-- ####################################################################
-- ###  SOURCE : permissions.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Permissions de collaboration par section.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (events, event_members, can_access_event) et
--  dashboard.sql (checklist_tasks, guests, event_vendors, planning_moments,
--  vendor_calls, inspiration_ideas).
--
--  Principe :
--   • Le PROPRIÉTAIRE de l'événement peut tout modifier.
--   • Un MEMBRE accepté peut TOUT VOIR (lecture) mais ne peut MODIFIER que les
--     sections que le propriétaire lui a accordées (event_members.permissions).
--   • La gestion de l'équipe reste réservée au propriétaire (déjà en place via
--     members_write_owner).
-- ============================================================================

set check_function_bodies = off;

-- 1. Sections éditables accordées à un membre (clés : budget, checklist,
--    invites, prestataires, planning, inspiration).
alter table public.event_members
  add column if not exists permissions text[] not null default '{}';

-- 2. Droit d'ÉDITION d'une section pour l'utilisateur courant.
create or replace function public.can_edit_section(p_event uuid, p_section text)
returns boolean
language sql security definer set search_path = public stable
as $$
  select
    exists (
      select 1 from public.events e
      where e.id = p_event and e.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.event_members m
      where m.event_id = p_event
        and m.user_id = auth.uid()
        and m.status = 'accepted'
        and p_section = any (coalesce(m.permissions, '{}'))
    );
$$;

-- 3. Politiques : lecture pour tout membre, écriture selon la section.
--    Modèle réutilisé pour chaque table (2 policies) :
--      <t>_read  → for select using can_access_event
--      <t>_write → for all using/with check can_edit_section(section)
--    (les policies permissives se combinent en OR : le SELECT reste ouvert à
--     tous les membres, l'écriture est restreinte à la section.)

-- Budget (catégories + dépenses)
drop policy if exists "budget_cat_access" on public.budget_categories;
drop policy if exists "budget_cat_read"   on public.budget_categories;
drop policy if exists "budget_cat_write"  on public.budget_categories;
create policy "budget_cat_read" on public.budget_categories
  for select using (public.can_access_event(event_id));
create policy "budget_cat_write" on public.budget_categories
  for all using (public.can_edit_section(event_id, 'budget'))
  with check (public.can_edit_section(event_id, 'budget'));

drop policy if exists "budget_exp_access" on public.budget_expenses;
drop policy if exists "budget_exp_read"   on public.budget_expenses;
drop policy if exists "budget_exp_write"  on public.budget_expenses;
create policy "budget_exp_read" on public.budget_expenses
  for select using (public.can_access_event(event_id));
create policy "budget_exp_write" on public.budget_expenses
  for all using (public.can_edit_section(event_id, 'budget'))
  with check (public.can_edit_section(event_id, 'budget'));

-- Checklist
drop policy if exists "checklist_access" on public.checklist_tasks;
drop policy if exists "checklist_read"   on public.checklist_tasks;
drop policy if exists "checklist_write"  on public.checklist_tasks;
create policy "checklist_read" on public.checklist_tasks
  for select using (public.can_access_event(event_id));
create policy "checklist_write" on public.checklist_tasks
  for all using (public.can_edit_section(event_id, 'checklist'))
  with check (public.can_edit_section(event_id, 'checklist'));

-- Invités
drop policy if exists "guests_access" on public.guests;
drop policy if exists "guests_read"   on public.guests;
drop policy if exists "guests_write"  on public.guests;
create policy "guests_read" on public.guests
  for select using (public.can_access_event(event_id));
create policy "guests_write" on public.guests
  for all using (public.can_edit_section(event_id, 'invites'))
  with check (public.can_edit_section(event_id, 'invites'));

-- Prestataires (event_vendors + vendor_calls)
drop policy if exists "event_vendors_access" on public.event_vendors;
drop policy if exists "event_vendors_read"   on public.event_vendors;
drop policy if exists "event_vendors_write"  on public.event_vendors;
create policy "event_vendors_read" on public.event_vendors
  for select using (public.can_access_event(event_id));
create policy "event_vendors_write" on public.event_vendors
  for all using (public.can_edit_section(event_id, 'prestataires'))
  with check (public.can_edit_section(event_id, 'prestataires'));

drop policy if exists "vendor_calls_access" on public.vendor_calls;
drop policy if exists "vendor_calls_read"   on public.vendor_calls;
drop policy if exists "vendor_calls_write"  on public.vendor_calls;
create policy "vendor_calls_read" on public.vendor_calls
  for select using (public.can_access_event(event_id));
create policy "vendor_calls_write" on public.vendor_calls
  for all using (public.can_edit_section(event_id, 'prestataires'))
  with check (public.can_edit_section(event_id, 'prestataires'));

-- Planning Jour J
drop policy if exists "planning_access" on public.planning_moments;
drop policy if exists "planning_read"   on public.planning_moments;
drop policy if exists "planning_write"  on public.planning_moments;
create policy "planning_read" on public.planning_moments
  for select using (public.can_access_event(event_id));
create policy "planning_write" on public.planning_moments
  for all using (public.can_edit_section(event_id, 'planning'))
  with check (public.can_edit_section(event_id, 'planning'));

-- Inspiration (idées)
drop policy if exists "inspiration_access" on public.inspiration_ideas;
drop policy if exists "inspiration_read"   on public.inspiration_ideas;
drop policy if exists "inspiration_write"  on public.inspiration_ideas;
create policy "inspiration_read" on public.inspiration_ideas
  for select using (public.can_access_event(event_id));
create policy "inspiration_write" on public.inspiration_ideas
  for all using (public.can_edit_section(event_id, 'inspiration'))
  with check (public.can_edit_section(event_id, 'inspiration'));

-- Inspiration (fichiers dans le bucket storage) : écriture/suppression réservées
-- à la section « inspiration » ; lecture inchangée (gérée dans dashboard.sql).
drop policy if exists "inspiration_write"  on storage.objects;
drop policy if exists "inspiration_delete" on storage.objects;
create policy "inspiration_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'inspiration'
    and public.can_edit_section(((storage.foldername(name))[1])::uuid, 'inspiration')
  );
create policy "inspiration_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'inspiration'
    and public.can_edit_section(((storage.foldername(name))[1])::uuid, 'inspiration')
  );

-- Fin.


-- ####################################################################
-- ###  SOURCE : collaboration.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Collaboration : acceptation d'invitation (équipe) & RSVP invités.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (event_members, events) et dashboard.sql (guests).
-- ============================================================================

set check_function_bodies = off;

-- ── ÉQUIPE : rejoindre un événement via un lien d'invitation ────────────────
-- L'invité (connecté) réclame la ligne event_members correspondant au lien.
-- La ligne n'est prise que si elle est libre (user_id null) ou déjà à lui.
create or replace function public.accept_invitation(p_member_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_event uuid;
  v_email text;
begin
  -- SÉCURITÉ : le lien n'est pas un jeton porteur. L'invitation est liée à un
  -- email → seul le compte dont l'email correspond peut l'accepter.
  select email into v_email from auth.users where id = auth.uid();
  update public.event_members
    set user_id = auth.uid(), status = 'accepted'
    where id = p_member_id
      and (user_id is null or user_id = auth.uid())
      and lower(email) = lower(coalesce(v_email, ''))
    returning event_id into v_event;
  return v_event; -- null si lien invalide, déjà pris, ou email non concordant
end;
$$;

grant execute on function public.accept_invitation(uuid) to authenticated;

-- Infos affichées sur la page d'invitation (avant d'accepter).
create or replace function public.invitation_info(p_member_id uuid)
returns table (event_name text, member_email text, member_role text, claimed boolean)
language sql
security definer set search_path = public
stable
as $$
  select e.name, m.email, m.role, (m.user_id is not null)
  from public.event_members m
  join public.events e on e.id = m.event_id
  where m.id = p_member_id;
$$;

grant execute on function public.invitation_info(uuid) to authenticated;

-- ── INVITÉS : RSVP par lien public (sans compte) ────────────────────────────
-- NOTE : guest_rsvp_info N'EST PAS défini ici. Sa version autoritaire (avec
-- date/heure/lieu/tenue, SANS email organisateur) vit dans event-details.sql,
-- qui fait `drop function` d'abord. Une seule définition → pas de conflit de
-- type de retour ni de fuite selon l'ordre d'exécution.

-- L'invité confirme ou décline via son lien.
create or replace function public.rsvp_guest(p_guest_id uuid, p_status text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  if p_status not in ('confirmé', 'décliné') then
    return false;
  end if;
  update public.guests set status = p_status where id = p_guest_id;
  return found;
end;
$$;

grant execute on function public.rsvp_guest(uuid, text) to anon, authenticated;

-- Fin.


-- ####################################################################
-- ###  SOURCE : collaboration-extra.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Compléments collaboration.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

set check_function_bodies = off;

-- Organisateur (propriétaire) d'un événement : nom + email, lisible par tout
-- membre ayant accès à l'événement (le RLS empêche sinon de lire son profil).
create or replace function public.event_organizer(p_event uuid)
returns table (id uuid, full_name text, email text)
language sql security definer set search_path = public stable
as $$
  select e.owner_id, p.full_name, u.email::text
  from public.events e
  join public.profiles p on p.id = e.owner_id
  join auth.users u on u.id = e.owner_id
  where e.id = p_event and public.can_access_event(p_event);
$$;
grant execute on function public.event_organizer(uuid) to authenticated;

-- Fin.


-- ####################################################################
-- ###  SOURCE : quote-details.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Devis « document » : lignes de prestation, coordonnées, totaux.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de pro.sql (table quotes) et messaging.sql (conversations).
-- ============================================================================

set check_function_bodies = off;

-- Champs du document de devis (le devis devient une fiche complète et figée).
alter table public.quotes add column if not exists quote_number   text;
alter table public.quotes add column if not exists validity_days  integer not null default 15;
alter table public.quotes add column if not exists intro_message  text;
alter table public.quotes add column if not exists event_need     text;
alter table public.quotes add column if not exists event_date     text;
alter table public.quotes add column if not exists event_location text;
alter table public.quotes add column if not exists guests_count   text;
alter table public.quotes add column if not exists client_email   text;
alter table public.quotes add column if not exists client_phone   text;
alter table public.quotes add column if not exists client_address text;
alter table public.quotes add column if not exists service_fee    numeric not null default 0;
alter table public.quotes add column if not exists tax_rate       numeric not null default 0;

-- Lignes de prestation : [{ label, description, qty, unit_price }, ...]
alter table public.quotes add column if not exists items jsonb not null default '[]'::jsonb;

-- Snapshot des coordonnées prestataire (document figé, indépendant du profil).
alter table public.quotes add column if not exists presta_name     text;
alter table public.quotes add column if not exists presta_category text;
alter table public.quotes add column if not exists presta_email    text;
alter table public.quotes add column if not exists presta_phone    text;
alter table public.quotes add column if not exists presta_address  text;

-- ── Devis accepté → jour réservé dans le calendrier du prestataire ──────────
-- SECURITY DEFINER : fonctionne que ce soit le client ou le prestataire qui
-- change le statut. N'agit que si la date du devis est au format aaaa-mm-jj.
create or replace function public.quote_booking_sync()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  d date;
begin
  if new.event_date is null or new.event_date !~ '^\d{4}-\d{2}-\d{2}$' then
    return new;
  end if;
  d := new.event_date::date;

  -- Passage à « accepté » → on réserve le jour.
  if new.status = 'accepté' and old.status is distinct from 'accepté' then
    insert into public.vendor_availability (prestataire_id, date, status)
    values (new.prestataire_id, d, 'booked')
    on conflict (prestataire_id, date) do update set status = 'booked';

  -- Sortie de « accepté » → on libère le jour, sauf si un autre devis accepté
  -- couvre déjà cette date (et seulement s'il était en statut « booked »).
  elsif old.status = 'accepté' and new.status is distinct from 'accepté' then
    if not exists (
      select 1 from public.quotes q
      where q.prestataire_id = new.prestataire_id
        and q.id <> new.id
        and q.status = 'accepté'
        and q.event_date = new.event_date
    ) then
      delete from public.vendor_availability
      where prestataire_id = new.prestataire_id and date = d and status = 'booked';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_quote_booking on public.quotes;
create trigger on_quote_booking
  after update of status on public.quotes
  for each row execute function public.quote_booking_sync();

-- ── Numéros de devis uniques (séquence dédiée, pas un count fragile) ────────
create sequence if not exists public.quote_number_seq;

-- Recale la séquence au-dessus du plus grand SUFFIXE déjà existant (devis créés
-- avant la séquence, ou repli côté app) → évite « duplicate key … quote_number ».
-- On ne garde que le nombre après le dernier tiret (ex. DEV-2026-0007 → 7).
select setval(
  'public.quote_number_seq',
  greatest(
    (select coalesce(max((regexp_replace(quote_number, '^.*-', ''))::bigint), 0)
       from public.quotes
      where quote_number ~ '-[0-9]+$'),
    (select last_value from public.quote_number_seq)
  ),
  true
);

create or replace function public.next_quote_number()
returns text
language sql security definer set search_path = public
as $$
  select 'DEV-' || to_char(now(), 'YYYY') || '-'
         || lpad(nextval('public.quote_number_seq')::text, 4, '0');
$$;
grant execute on function public.next_quote_number() to authenticated;

-- Index unique (non fatal si d'anciens doublons existent déjà).
do $$
begin
  create unique index if not exists quotes_quote_number_key
    on public.quotes (quote_number);
exception when others then
  raise notice 'Index unique quote_number non créé (doublons pré-existants).';
end $$;

-- Fin.


-- ####################################################################
-- ###  SOURCE : event-details.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Détails d'événement (heure, lieu, tenue) + RSVP enrichi.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql, dashboard.sql et collaboration.sql.
-- ============================================================================

set check_function_bodies = off;

-- 1. Champs optionnels sur l'événement.
alter table public.events
  add column if not exists event_time text,
  add column if not exists location   text,
  add column if not exists dress_code text;

-- 2. guest_rsvp_info enrichi (on remplace : la signature de retour change).
--    SÉCURITÉ : ne PAS exposer l'email de l'organisateur à anon (fuite).
drop function if exists public.guest_rsvp_info(uuid);
create or replace function public.guest_rsvp_info(p_guest_id uuid)
returns table (
  guest_name      text,
  event_name      text,
  status          text,
  event_date      date,
  event_time      text,
  location        text,
  dress_code      text,
  plus_one        boolean
)
language sql
security definer set search_path = public
stable
as $$
  select g.name, e.name, g.status,
         e.event_date, e.event_time, e.location, e.dress_code, g.plus_one
  from public.guests g
  join public.events e on e.id = g.event_id
  where g.id = p_guest_id;
$$;

grant execute on function public.guest_rsvp_info(uuid) to anon, authenticated;

-- Fin.


-- ####################################################################
-- ###  SOURCE : event-vendors-status.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Statuts des prestataires d'un événement.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  Nouveau modèle : le statut d'un prestataire suit ses devis (agrégat) :
--   • « en attente » dès qu'une demande de devis est envoyée,
--   • « confirmé »   dès qu'un de ses devis est accepté (jamais rétrogradé),
--   • « refusé »     si un devis est refusé et qu'il n'est pas déjà confirmé.
--  On retire l'ancien « devis reçu ».
-- ============================================================================

set check_function_bodies = off;

-- 1. Migration des anciennes valeurs.
update public.event_vendors set status = 'en attente' where status = 'devis reçu';

-- 2. Nouvelle contrainte de statut.
alter table public.event_vendors drop constraint if exists event_vendors_status_check;
alter table public.event_vendors
  add constraint event_vendors_status_check
  check (status in ('confirmé', 'en attente', 'refusé'));

-- Fin.


-- ####################################################################
-- ###  SOURCE : invitation-card.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Carte d'invitation personnalisée (une par événement).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  L'organisateur téléverse sa carte (image, Cloudinary) ; on la stocke sur
--  l'événement et on l'affiche dans l'email RSVP (avec Accepter / Décliner).
-- ============================================================================

alter table public.events
  add column if not exists invitation_card_url text;

-- guest_rsvp_info enrichi avec la carte (remplace la version de security.sql).
-- ⚠️ À exécuter APRÈS security.sql (sinon security.sql la ré-écrase sans la carte).
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
  plus_one   boolean,
  invitation_card_url text
)
language sql security definer set search_path = public stable
as $$
  select g.name, e.name, g.status,
         e.event_date, e.event_time, e.location, e.dress_code, g.plus_one,
         e.invitation_card_url
  from public.guests g
  join public.events e on e.id = g.event_id
  where g.id = p_guest_id;
$$;
grant execute on function public.guest_rsvp_info(uuid) to anon, authenticated;

-- Fin.


-- ####################################################################
-- ###  SOURCE : inspiration-media.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Inspiration : distinguer image / vidéo.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

alter table public.inspiration_ideas
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image', 'video'));

-- Lien d'origine (import Pinterest/TikTok/Instagram…) : pour les vidéos non
-- lisibles en ligne, on affiche la miniature + un bouton « lecture » qui ouvre
-- ce lien source.
alter table public.inspiration_ideas
  add column if not exists source_url text;

-- Fin.


-- ####################################################################
-- ###  SOURCE : message-reads.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Accusés de lecture & compteurs de messages non lus.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de messaging.sql (conversations, messages, is_conversation_participant).
-- ============================================================================

set check_function_bodies = off;

-- Dernière lecture d'une conversation par un utilisateur.
create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_reads enable row level security;

-- Les participants voient les marqueurs de la conversation (pour l'accusé « Vu »).
drop policy if exists "reads_select" on public.conversation_reads;
create policy "reads_select" on public.conversation_reads
  for select using (public.is_conversation_participant(conversation_id));

-- Chacun gère SON propre marqueur.
drop policy if exists "reads_write" on public.conversation_reads;
create policy "reads_write" on public.conversation_reads
  for all
  using (user_id = auth.uid() and public.is_conversation_participant(conversation_id))
  with check (user_id = auth.uid() and public.is_conversation_participant(conversation_id));

-- Marque une conversation comme lue (à l'ouverture du fil).
create or replace function public.mark_conversation_read(p_conv uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_conversation_participant(p_conv) then
    insert into public.conversation_reads (conversation_id, user_id, last_read_at)
    values (p_conv, auth.uid(), now())
    on conflict (conversation_id, user_id)
      do update set last_read_at = now();
  end if;
end;
$$;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Nombre de messages non lus par conversation, pour l'utilisateur courant.
create or replace function public.my_unread_counts()
returns table (conversation_id uuid, unread bigint)
language sql security definer set search_path = public stable
as $$
  select m.conversation_id, count(*)::bigint
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  left join public.conversation_reads r
    on r.conversation_id = m.conversation_id and r.user_id = auth.uid()
  where auth.uid() in (c.particulier_id, c.prestataire_id)
    and m.sender_id <> auth.uid()
    and (r.last_read_at is null or m.created_at > r.last_read_at)
  group by m.conversation_id;
$$;
grant execute on function public.my_unread_counts() to authenticated;

-- Fin.


-- ####################################################################
-- ###  SOURCE : messaging-dedupe.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Fusion des conversations en double + garde-fou anti-duplication.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  Règle : UNE seule conversation par binôme (particulier ↔ prestataire). Des
--  doublons ont pu être créés avant la mise en place de la réutilisation. On
--  garde la conversation la plus RÉCENTE (elle porte la demande la plus fraîche
--  → pré-remplissage du devis), on y rattache TOUS les messages ET devis des
--  doublons (les devis restent des lignes distinctes, ils ne sont PAS fusionnés),
--  puis on supprime les conversations en double. Un index unique empêche toute
--  nouvelle duplication.
-- ============================================================================

set check_function_bodies = off;

-- 1. Rattache les messages des doublons à la conversation conservée (la + récente).
update public.messages m
  set conversation_id = k.keep_id
  from (
    select id,
           first_value(id) over (
             partition by particulier_id, prestataire_id
             order by created_at desc
           ) as keep_id
    from public.conversations
  ) k
  where m.conversation_id = k.id
    and k.id <> k.keep_id;

-- 2. Rattache les devis des doublons à la conversation conservée (historique
--    complet : plusieurs devis pour une seule conversation).
update public.quotes q
  set conversation_id = k.keep_id
  from (
    select id,
           first_value(id) over (
             partition by particulier_id, prestataire_id
             order by created_at desc
           ) as keep_id
    from public.conversations
  ) k
  where q.conversation_id = k.id
    and k.id <> k.keep_id;

-- 3. Supprime les conversations en double (tout sauf la conservée).
delete from public.conversations c
  using (
    select id,
           first_value(id) over (
             partition by particulier_id, prestataire_id
             order by created_at desc
           ) as keep_id
    from public.conversations
  ) k
  where c.id = k.id
    and k.id <> k.keep_id;

-- 4. Recale l'horodatage du dernier message sur la conversation conservée.
update public.conversations c
  set last_message_at = m.max_created
  from (
    select conversation_id, max(created_at) as max_created
    from public.messages
    group by conversation_id
  ) m
  where m.conversation_id = c.id
    and m.max_created > c.last_message_at;

-- 5. Garde-fou : une seule conversation par binôme, définitivement.
create unique index if not exists conversations_pair_uniq
  on public.conversations (particulier_id, prestataire_id);

-- Fin.


-- ####################################################################
-- ###  SOURCE : team-chat.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Chat de groupe « Équipe » (par événement).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (events, event_members, can_access_event, profiles).
--  Tous les membres d'un événement (propriétaire + collaborateurs acceptés)
--  peuvent lire ET écrire : aucune permission de section n'est requise ici.
-- ============================================================================

set check_function_bodies = off;

-- 1. MESSAGES D'ÉQUIPE ───────────────────────────────────────────────────────
-- Le nom / l'avatar de l'expéditeur sont dénormalisés (les profils ne sont pas
-- lisibles entre membres à cause du RLS) — renseignés par post_team_message.
create table if not exists public.team_messages (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  sender_id     uuid not null references public.profiles (id) on delete cascade,
  sender_name   text,
  sender_avatar text,
  body          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists team_messages_event_idx
  on public.team_messages (event_id, created_at);

alter table public.team_messages enable row level security;

-- Lecture : tout membre de l'équipe (propriétaire ou collaborateur accepté).
drop policy if exists "team_msg_select" on public.team_messages;
create policy "team_msg_select" on public.team_messages
  for select using (public.can_access_event(event_id));

-- Pas de policy INSERT : l'écriture passe UNIQUEMENT par post_team_message
-- (SECURITY DEFINER) qui garantit un nom / avatar fiables (anti-usurpation).

-- 2. POSTER UN MESSAGE ────────────────────────────────────────────────────────
create or replace function public.post_team_message(p_event uuid, p_body text)
returns public.team_messages
language plpgsql security definer set search_path = public
as $$
declare
  v_row public.team_messages;
begin
  if not public.can_access_event(p_event) then
    raise exception 'forbidden';
  end if;
  if coalesce(btrim(p_body), '') = '' then
    raise exception 'empty';
  end if;
  insert into public.team_messages (event_id, sender_id, sender_name, sender_avatar, body)
  select p_event, auth.uid(), p.full_name, p.avatar_url, p_body
  from public.profiles p
  where p.id = auth.uid()
  returning * into v_row;
  return v_row;
end;
$$;
grant execute on function public.post_team_message(uuid, text) to authenticated;

-- 3. ACCUSÉS DE LECTURE (par événement) ───────────────────────────────────────
create table if not exists public.team_reads (
  event_id     uuid not null references public.events (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.team_reads enable row level security;

drop policy if exists "team_reads_select" on public.team_reads;
create policy "team_reads_select" on public.team_reads
  for select using (public.can_access_event(event_id));

drop policy if exists "team_reads_write" on public.team_reads;
create policy "team_reads_write" on public.team_reads
  for all
  using (user_id = auth.uid() and public.can_access_event(event_id))
  with check (user_id = auth.uid() and public.can_access_event(event_id));

create or replace function public.mark_team_read(p_event uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if public.can_access_event(p_event) then
    insert into public.team_reads (event_id, user_id, last_read_at)
    values (p_event, auth.uid(), now())
    on conflict (event_id, user_id)
      do update set last_read_at = now();
  end if;
end;
$$;
grant execute on function public.mark_team_read(uuid) to authenticated;

-- 4. LISTE DES ÉQUIPES (une par événement de l'utilisateur) ───────────────────
-- Affichée seulement si l'événement a au moins un collaborateur OU des messages
-- (inutile d'afficher « Équipe » pour un organisateur seul sans activité).
create or replace function public.my_team_threads()
returns table (
  event_id   uuid,
  event_name text,
  last_body  text,
  last_at    timestamptz,
  unread     bigint
)
language sql security definer set search_path = public stable
as $$
  select
    e.id,
    e.name,
    (select tm.body from public.team_messages tm
       where tm.event_id = e.id order by tm.created_at desc limit 1),
    coalesce(
      (select max(tm.created_at) from public.team_messages tm where tm.event_id = e.id),
      e.created_at
    ),
    (select count(*) from public.team_messages tm
       left join public.team_reads tr
         on tr.event_id = e.id and tr.user_id = auth.uid()
       where tm.event_id = e.id
         and tm.sender_id <> auth.uid()
         and (tr.last_read_at is null or tm.created_at > tr.last_read_at)
    )::bigint
  from public.events e
  where public.can_access_event(e.id)
    and (
      exists (select 1 from public.event_members m where m.event_id = e.id)
      or exists (select 1 from public.team_messages tm where tm.event_id = e.id)
    );
$$;
grant execute on function public.my_team_threads() to authenticated;

-- 5. Temps réel : diffuser les nouveaux messages d'équipe.
do $$
begin
  begin
    alter publication supabase_realtime add table public.team_messages;
  exception when others then null;
  end;
end $$;

-- Fin.


-- ####################################################################
-- ###  SOURCE : category-fields.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Enrichissement des catégories de prestataire (admin).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de admin.sql (table public.vendor_categories).
--  Ajoute une description et un statut actif/désactivé (sans avatar ni branche).
-- ============================================================================

alter table public.vendor_categories
  add column if not exists description text;

alter table public.vendor_categories
  add column if not exists active boolean not null default true;

-- Fin.


-- ####################################################################
-- ###  SOURCE : profile-extras.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Champs profil supplémentaires (données newsletter / relances).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (table public.profiles).
-- ============================================================================

alter table public.profiles
  add column if not exists birthdate date;

alter table public.profiles
  add column if not exists phone text;

alter table public.profiles
  add column if not exists newsletter_opt_in boolean not null default true;

-- Fin.


-- ####################################################################
-- ###  SOURCE : vibes.sql
-- ####################################################################

-- ============================================================================
--  Misstice — « Ambiance & Vibe » sur les prestataires (filtres + badges).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de vendors (annuaire). Le prestataire renseigne lui-même ses tags
--  depuis son profil ; ils servent aux filtres et aux badges publics.
-- ============================================================================

alter table public.vendors add column if not exists moods       text[] not null default '{}';
alter table public.vendors add column if not exists energies    text[] not null default '{}';
alter table public.vendors add column if not exists lights      text[] not null default '{}';
alter table public.vendors add column if not exists palettes    text[] not null default '{}';
alter table public.vendors add column if not exists atmospheres text[] not null default '{}';
alter table public.vendors add column if not exists music_styles text[] not null default '{}';

-- Fin.


-- ####################################################################
-- ###  SOURCE : gift-list.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Liste de cadeaux d'un événement (liens externes Fnac/Amazon…).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (events, can_access_event) et permissions.sql
--  (can_edit_section). Section déléguable : 'cadeaux'.
-- ============================================================================

set check_function_bodies = off;

create table if not exists public.gift_items (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  title      text not null,
  url        text,           -- lien externe (Fnac, Amazon…)
  price      text,           -- libellé libre (ex. « 45 € »)
  note       text,
  reserved   boolean not null default false,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists gift_items_event_idx on public.gift_items (event_id);

alter table public.gift_items enable row level security;

-- Lecture : tout membre de l'événement.
drop policy if exists "gift_items_read" on public.gift_items;
create policy "gift_items_read" on public.gift_items
  for select using (public.can_access_event(event_id));

-- Écriture : section « cadeaux » (propriétaire ou collaborateur autorisé).
drop policy if exists "gift_items_write" on public.gift_items;
create policy "gift_items_write" on public.gift_items
  for all using (public.can_edit_section(event_id, 'cadeaux'))
  with check (public.can_edit_section(event_id, 'cadeaux'));

-- Fin.


-- ####################################################################
-- ###  SOURCE : seating.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Plan de table d'un événement (tables + placements).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (events, can_access_event) et permissions.sql
--  (can_edit_section). Section déléguable : 'plan_table'.
-- ============================================================================

set check_function_bodies = off;

-- Tables (au sens « table de réception »).
create table if not exists public.seating_tables (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  name       text not null,
  capacity   integer not null default 8,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists seating_tables_event_idx on public.seating_tables (event_id);

alter table public.seating_tables enable row level security;
drop policy if exists "seating_tables_read" on public.seating_tables;
create policy "seating_tables_read" on public.seating_tables
  for select using (public.can_access_event(event_id));
drop policy if exists "seating_tables_write" on public.seating_tables;
create policy "seating_tables_write" on public.seating_tables
  for all using (public.can_edit_section(event_id, 'plan_table'))
  with check (public.can_edit_section(event_id, 'plan_table'));

-- Placements (une personne assise à une table).
create table if not exists public.seating_seats (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  table_id   uuid not null references public.seating_tables (id) on delete cascade,
  name       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists seating_seats_table_idx on public.seating_seats (table_id);
create index if not exists seating_seats_event_idx on public.seating_seats (event_id);

alter table public.seating_seats enable row level security;
drop policy if exists "seating_seats_read" on public.seating_seats;
create policy "seating_seats_read" on public.seating_seats
  for select using (public.can_access_event(event_id));
drop policy if exists "seating_seats_write" on public.seating_seats;
create policy "seating_seats_write" on public.seating_seats
  for all using (public.can_edit_section(event_id, 'plan_table'))
  with check (public.can_edit_section(event_id, 'plan_table'));

-- Fin.


-- ####################################################################
-- ###  SOURCE : event-invitation.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Site d'invitation public + RSVP partageable (par événement).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (events) et dashboard.sql (guests).
--  Un lien unique par événement : les invités s'inscrivent eux-mêmes (oui/non)
--  sans compte. L'écriture passe par une fonction SECURITY DEFINER validée par
--  le jeton de partage (aucune écriture directe possible via RLS).
-- ============================================================================

set check_function_bodies = off;

-- Jeton de partage public de l'événement.
alter table public.events
  add column if not exists share_token uuid not null default gen_random_uuid();
-- Backfill des lignes existantes qui n'auraient pas de jeton.
update public.events set share_token = gen_random_uuid() where share_token is null;
create unique index if not exists events_share_token_idx on public.events (share_token);

-- Infos publiques de l'invitation (lues via le jeton, pas via RLS).
create or replace function public.public_event_invitation(p_token uuid)
returns table (
  event_id            uuid,
  name                text,
  event_date          date,
  event_type          text,
  host_name           text,
  invitation_card_url text
)
language sql security definer set search_path = public stable
as $$
  select e.id, e.name, e.event_date, e.type,
         coalesce(p.full_name, ''), e.invitation_card_url
  from public.events e
  left join public.profiles p on p.id = e.owner_id
  where e.share_token = p_token;
$$;
grant execute on function public.public_event_invitation(uuid) to anon, authenticated;

-- RSVP public : l'invité s'inscrit lui-même via le jeton.
create or replace function public.rsvp_public(
  p_token     uuid,
  p_name      text,
  p_email     text,
  p_status    text,
  p_plus_one  boolean
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_event uuid;
begin
  if p_status not in ('confirmé', 'décliné') then
    return false;
  end if;
  if coalesce(btrim(p_name), '') = '' then
    return false;
  end if;
  select id into v_event from public.events where share_token = p_token;
  if v_event is null then
    return false;
  end if;
  insert into public.guests (event_id, name, email, status, plus_one)
  values (
    v_event,
    btrim(p_name),
    nullif(btrim(coalesce(p_email, '')), ''),
    p_status,
    coalesce(p_plus_one, false)
  );
  return true;
end;
$$;
grant execute on function public.rsvp_public(uuid, text, text, text, boolean) to anon, authenticated;

-- Fin.


-- ####################################################################
-- ###  SOURCE : availability-public.sql
-- ####################################################################

-- ============================================================================
--  Misstice — Lecture publique des disponibilités prestataire.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Nécessaire pour afficher « Prochaine disponibilité » sur la fiche publique.
--  (À lancer APRÈS pro.sql / security.sql pour fixer la policy de lecture.)
-- ============================================================================

drop policy if exists "availability_read" on public.vendor_availability;
create policy "availability_read" on public.vendor_availability
  for select using (true);

-- Fin.

