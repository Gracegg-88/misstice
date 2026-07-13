-- ============================================================================
--  Misstice — Favoris prestataires persistés (par compte).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Remplace le stockage localStorage : les favoris sont désormais liés au
--  compte (donc communs à tous les événements de l'utilisateur).
-- ============================================================================

create table if not exists public.vendor_favorites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  vendor_id  uuid not null references public.vendors (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vendor_id)
);

alter table public.vendor_favorites enable row level security;

drop policy if exists "favorites_own" on public.vendor_favorites;
create policy "favorites_own" on public.vendor_favorites
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Fin.
