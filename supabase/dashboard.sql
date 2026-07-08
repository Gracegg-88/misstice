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
