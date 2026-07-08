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
