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

drop policy if exists "events_admin_read" on public.events;
create policy "events_admin_read" on public.events
  for select using (public.is_admin());

drop policy if exists "budget_expenses_admin_read" on public.budget_expenses;
create policy "budget_expenses_admin_read" on public.budget_expenses
  for select using (public.is_admin());

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

-- 6. LISTE DES UTILISATEURS pour l'admin (avec email, réservé aux admins)
create or replace function public.admin_list_users()
returns table (id uuid, full_name text, role text, email text, created_at timestamptz)
language sql
security definer set search_path = public
stable
as $$
  select p.id, p.full_name, p.role, u.email::text, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;

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

-- Changer le rôle d'un compte.
create or replace function public.admin_set_role(p_target uuid, p_role text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Impossible de changer son propre rôle';
  end if;
  if p_role not in ('particulier', 'prestataire', 'admin') then
    raise exception 'Rôle invalide';
  end if;
  update public.profiles set role = p_role where id = p_target;
end;
$$;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

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
