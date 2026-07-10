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
