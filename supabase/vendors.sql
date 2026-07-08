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
