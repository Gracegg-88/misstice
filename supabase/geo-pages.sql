-- ============================================================================
--  Misstice — Pages géolocalisées (villes × prestataires × types d'événement)
--  Dépend de : admin.sql (public.is_admin), vendors.sql (table public.vendors).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  Volontairement additif : aucune colonne ajoutée ni trigger posé sur
--  public.vendors / public.vendor_profiles. Le rapprochement ville ↔
--  prestataire se fait en lisant vendors.city tel quel côté application
--  (voir lib/geo.ts, fonction slugify) — pas de duplication de données ici.
-- ============================================================================

-- 1. Référentiel des villes ciblées par le SEO géolocalisé (contenu éditorial :
--    nom, région, intro). Une ville n'est réellement publiée (hub avec
--    prestataires, pages ville×catégorie) que si elle a assez de prestataires
--    réels — ce seuil se calcule en direct côté application, pas ici.
create table if not exists public.cities (
  slug       text primary key,
  name       text not null,
  region     text not null,
  intro_text text,
  created_at timestamptz not null default now()
);

alter table public.cities enable row level security;

drop policy if exists "cities_read" on public.cities;
create policy "cities_read" on public.cities for select using (true);

drop policy if exists "cities_admin_write" on public.cities;
create policy "cities_admin_write" on public.cities
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.cities (slug, name, region) values
  ('paris', 'Paris', 'Île-de-France'),
  ('lyon', 'Lyon', 'Auvergne-Rhône-Alpes'),
  ('marseille', 'Marseille', 'Provence-Alpes-Côte d''Azur'),
  ('toulouse', 'Toulouse', 'Occitanie'),
  ('bordeaux', 'Bordeaux', 'Nouvelle-Aquitaine'),
  ('nantes', 'Nantes', 'Pays de la Loire'),
  ('lille', 'Lille', 'Hauts-de-France'),
  ('strasbourg', 'Strasbourg', 'Grand Est'),
  ('nice', 'Nice', 'Provence-Alpes-Côte d''Azur'),
  ('montpellier', 'Montpellier', 'Occitanie'),
  ('rennes', 'Rennes', 'Bretagne'),
  ('grenoble', 'Grenoble', 'Auvergne-Rhône-Alpes'),
  ('rouen', 'Rouen', 'Normandie'),
  ('toulon', 'Toulon', 'Provence-Alpes-Côte d''Azur'),
  ('reims', 'Reims', 'Grand Est'),
  ('saint-etienne', 'Saint-Étienne', 'Auvergne-Rhône-Alpes'),
  ('le-havre', 'Le Havre', 'Normandie'),
  ('angers', 'Angers', 'Pays de la Loire'),
  ('dijon', 'Dijon', 'Bourgogne-Franche-Comté'),
  ('nimes', 'Nîmes', 'Occitanie')
on conflict (slug) do nothing;

-- 2. Types d'événements — mêmes libellés que components/EventTypes.tsx.
create table if not exists public.event_types (
  slug     text primary key,
  name     text not null,
  position integer not null default 0
);

alter table public.event_types enable row level security;

drop policy if exists "event_types_read" on public.event_types;
create policy "event_types_read" on public.event_types for select using (true);

drop policy if exists "event_types_admin_write" on public.event_types;
create policy "event_types_admin_write" on public.event_types
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.event_types (slug, name, position) values
  ('mariage', 'Mariage', 1),
  ('anniversaire', 'Anniversaire', 2),
  ('bapteme', 'Baptême', 3),
  ('gala', 'Gala', 4),
  ('baby-shower', 'Baby Shower', 5)
on conflict (slug) do nothing;

-- 3. Liste d'attente affichée sur les pages ville/catégorie encore sous le
--    seuil de publication ("bientôt disponible") : capte un intérêt réel pour
--    prioriser objectivement les prochaines villes/catégories à ouvrir,
--    plutôt qu'une redirection ou une page vide.
create table if not exists public.geo_waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  city_slug  text,
  category   text,
  event_type text,
  created_at timestamptz not null default now()
);

alter table public.geo_waitlist enable row level security;

drop policy if exists "geo_waitlist_insert" on public.geo_waitlist;
create policy "geo_waitlist_insert" on public.geo_waitlist
  for insert with check (true);

drop policy if exists "geo_waitlist_admin_read" on public.geo_waitlist;
create policy "geo_waitlist_admin_read" on public.geo_waitlist
  for select using (public.is_admin());

-- Fin.
