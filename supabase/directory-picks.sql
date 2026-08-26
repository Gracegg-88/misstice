-- ============================================================================
--  Misstice — Sélections "Top 10" éditoriales (ville×catégorie / ville×événement)
--  Dépend de : geo-pages.sql (table cities), geo-event-content.sql (table
--  event_types).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  Prestataires publics non inscrits sur Misstice, affichés sur les pages
--  ville×catégorie et ville×événement en attendant assez de vrais
--  prestataires vérifiés (voir lib/geo.ts, MIN_VERIFIED_VENDORS). Jamais
--  générées en masse ni inventées : chaque ligne porte sa source
--  (source_url) et sa date de vérification (verified_at), remplie à la main
--  combinaison par combinaison, jamais par scraping automatique (conditions
--  d'utilisation Google Places / Pages Jaunes). claimed_vendor_id se remplit
--  le jour où ce prestataire s'inscrit vraiment sur Misstice, sans
--  supprimer la ligne, pour garder l'historique.
-- ============================================================================

create table if not exists public.city_category_picks (
  id uuid primary key default gen_random_uuid(),
  city_slug text not null references public.cities (slug),
  category text not null,
  rank smallint not null check (rank between 1 and 10),
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  phone text,
  price_level text,
  description text not null,
  source_url text not null,
  verified_at timestamptz not null default now(),
  claimed_vendor_id uuid references public.vendors (id),
  created_at timestamptz not null default now(),
  unique (city_slug, category, rank)
);

create table if not exists public.city_event_picks (
  id uuid primary key default gen_random_uuid(),
  city_slug text not null references public.cities (slug),
  event_type_slug text not null references public.event_types (slug),
  rank smallint not null check (rank between 1 and 10),
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  phone text,
  price_level text,
  description text not null,
  source_url text not null,
  verified_at timestamptz not null default now(),
  claimed_vendor_id uuid references public.vendors (id),
  created_at timestamptz not null default now(),
  unique (city_slug, event_type_slug, rank)
);

alter table public.city_category_picks enable row level security;
alter table public.city_event_picks enable row level security;

drop policy if exists "city_category_picks_read" on public.city_category_picks;
create policy "city_category_picks_read" on public.city_category_picks for select using (true);

drop policy if exists "city_category_picks_admin_write" on public.city_category_picks;
create policy "city_category_picks_admin_write" on public.city_category_picks
  for all using (is_admin()) with check (is_admin());

drop policy if exists "city_event_picks_read" on public.city_event_picks;
create policy "city_event_picks_read" on public.city_event_picks for select using (true);

drop policy if exists "city_event_picks_admin_write" on public.city_event_picks;
create policy "city_event_picks_admin_write" on public.city_event_picks
  for all using (is_admin()) with check (is_admin());
