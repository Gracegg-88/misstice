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
