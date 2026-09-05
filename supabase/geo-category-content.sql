-- ============================================================================
--  Misstice — Contenu éditorial des pages ville×catégorie
--  (/prestataires/ville/[ville]/[categorie])
--  Dépend de : geo-pages.sql (table cities).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  Même principe que geo-event-content.sql : une ligne ici publie la page
--  correspondante indépendamment du nombre de prestataires déjà inscrits.
--  Catégories choisies : Traiteur et Photographe — les deux seules dont le
--  nom est identique dans les deux listes de taxonomie trouvées dans le
--  repo (admin.sql à 8 catégories vs vendor-categories.sql à 51), donc sans
--  risque de décalage avec la vraie table vendor_categories. Aucune
--  statistique inventée sur les origines — mêmes principes que
--  geo-event-content.sql.
-- ============================================================================

create table if not exists public.city_category_content (
  city_slug   text not null references public.cities(slug) on delete cascade,
  category    text not null,
  intro_text  text not null,
  created_at  timestamptz not null default now(),
  primary key (city_slug, category)
);

alter table public.city_category_content enable row level security;

drop policy if exists "city_category_content_read" on public.city_category_content;
create policy "city_category_content_read" on public.city_category_content for select using (true);

drop policy if exists "city_category_content_admin_write" on public.city_category_content;
create policy "city_category_content_admin_write" on public.city_category_content
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.city_category_content (city_slug, category, intro_text) values

-- ── Traiteur ────────────────────────────────────────────────────────────
('paris', 'Traiteur',
  'Entre bistronomie parisienne et cuisines du monde, les traiteurs de la capitale savent composer un menu à votre image, qu''il soit classique ou métissé. Comparez leurs formules et leurs avis vérifiés avant de demander un devis gratuit sur Misstice.'),
('lyon', 'Traiteur',
  'Capitale de la gastronomie, Lyon regorge de traiteurs formés dans les meilleures maisons — des bouchons traditionnels aux menus plus contemporains. Misstice centralise leurs devis pour comparer sans multiplier les rendez-vous.'),
('marseille', 'Traiteur',
  'De la bouillabaisse aux saveurs nord-africaines, les traiteurs marseillais reflètent le brassage culinaire de la cité phocéenne. Demandez plusieurs devis vérifiés et comparez-les directement dans Misstice.'),
('toulouse', 'Traiteur',
  'Cassoulet, foie gras ou garbure : les traiteurs toulousains maîtrisent les classiques du sud-ouest autant que des menus plus légers pour vos réceptions. Comparez leurs prix et leurs avis sur Misstice avant de réserver.'),
('bordeaux', 'Traiteur',
  'Entre canelés, huîtres du bassin d''Arcachon et accords mets-vins, les traiteurs bordelais savent sublimer une table. Misstice vous met en relation avec ceux déjà vérifiés dans la région.'),
('nantes', 'Traiteur',
  'Produits de la mer, beurre blanc et cuisine du terroir : les traiteurs nantais puisent dans les saveurs de l''estuaire de la Loire. Comparez leurs formules et leurs avis vérifiés sur Misstice.'),
('lille', 'Traiteur',
  'Carbonnade flamande, welsh ou influences belges : les traiteurs lillois cultivent une cuisine généreuse et conviviale. Demandez vos devis gratuitement et comparez-les sur Misstice.'),
('strasbourg', 'Traiteur',
  'Choucroute, flammekueche ou bretzel : les traiteurs strasbourgeois maîtrisent aussi bien les classiques alsaciens que des menus plus internationaux. Comparez leurs devis vérifiés sur Misstice.'),
('nice', 'Traiteur',
  'Socca, salade niçoise, cuisine méditerranéenne : les traiteurs niçois composent des menus ensoleillés pour vos réceptions en extérieur. Misstice centralise leurs devis et leurs avis vérifiés.'),
('montpellier', 'Traiteur',
  'Entre cuisine méditerranéenne et huîtres de Bouzigues, les traiteurs montpelliérains s''adaptent à toutes les envies, du repas assis au buffet convivial. Comparez-les sur Misstice avant de réserver.'),
('rennes', 'Traiteur',
  'Galettes, cidre breton et produits de la mer : les traiteurs rennais savent composer une table généreuse et sans chichis. Demandez plusieurs devis vérifiés directement sur Misstice.'),
('grenoble', 'Traiteur',
  'Gratin dauphinois, ravioles du Dauphiné et fromages alpins : les traiteurs grenoblois cuisinent les classiques montagnards avec finesse. Comparez leurs formules et leurs avis sur Misstice.'),
('rouen', 'Traiteur',
  'Canard à la rouennaise, cidre et gastronomie normande : les traiteurs rouennais proposent des menus généreux et raffinés. Misstice vous met en relation avec ceux déjà vérifiés de la région.'),
('toulon', 'Traiteur',
  'Cuisine provençale et produits de la mer varois : les traiteurs toulonnais composent des menus ensoleillés, parfaits pour une réception en bord de mer. Comparez leurs devis vérifiés sur Misstice.'),
('reims', 'Traiteur',
  'Biscuits roses et accords mets-champagne : les traiteurs rémois savent sublimer une réception d''exception. Demandez vos devis gratuitement et comparez-les sur Misstice.'),
('saint-etienne', 'Traiteur',
  'Fourme de Montbrison et cuisine généreuse du Forez : les traiteurs stéphanois proposent des menus authentiques, loin des standards. Comparez leurs formules et leurs avis vérifiés sur Misstice.'),
('le-havre', 'Traiteur',
  'Produits de la mer et gastronomie normande : les traiteurs havrais composent des menus généreux, à l''image de leur ville portuaire. Misstice centralise leurs devis vérifiés.'),
('angers', 'Traiteur',
  'Rillauds angevins, vins de Loire et douceur du terroir : les traiteurs angevins cultivent une cuisine généreuse et raffinée. Comparez leurs devis vérifiés directement sur Misstice.'),
('dijon', 'Traiteur',
  'Bœuf bourguignon, moutarde de Dijon et cassis : les traiteurs dijonnais maîtrisent les grands classiques bourguignons comme des menus plus contemporains. Comparez-les sur Misstice avant de réserver.'),
('nimes', 'Traiteur',
  'Brandade de morue et cuisine camarguaise : les traiteurs nîmois composent des menus généreux et ensoleillés, entre Provence et Occitanie. Demandez vos devis vérifiés sur Misstice.'),

-- ── Photographe ─────────────────────────────────────────────────────────
('paris', 'Photographe',
  'Des quais de Seine aux jardins parisiens, la capitale offre une infinité de décors pour vos photos. Comparez les portfolios et les avis vérifiés des photographes parisiens sur Misstice avant de demander un devis.'),
('lyon', 'Photographe',
  'Traboules du Vieux Lyon, colline de Fourvière, berges du Rhône : les photographes lyonnais connaissent les recoins les plus photogéniques de la ville. Misstice centralise leurs portfolios et leurs devis.'),
('marseille', 'Photographe',
  'Entre Vieux-Port, calanques et lumière méditerranéenne, les photographes marseillais savent capter la lumière si particulière du sud. Comparez leurs portfolios vérifiés sur Misstice.'),
('toulouse', 'Photographe',
  'Sous les façades de brique rose et le long de la Garonne, les photographes toulousains composent des clichés chaleureux et lumineux. Demandez vos devis gratuitement sur Misstice.'),
('bordeaux', 'Photographe',
  'Façades XVIIIe classées à l''UNESCO, quais de Garonne, vignobles alentour : les photographes bordelais ont l''embarras du choix pour vos photos. Comparez leurs portfolios sur Misstice.'),
('nantes', 'Photographe',
  'Île de Nantes, château des ducs de Bretagne, bords de Loire : les photographes nantais aiment mêler patrimoine et esprit créatif dans leurs clichés. Misstice centralise leurs devis vérifiés.'),
('lille', 'Photographe',
  'Vieux-Lille et son architecture flamande offrent un décor unique en France pour vos photos de mariage. Comparez les portfolios des photographes lillois vérifiés sur Misstice.'),
('strasbourg', 'Photographe',
  'Petite France, colombages alsaciens et bords de l''Ill : les photographes strasbourgeois composent des clichés pleins de charme. Demandez vos devis gratuitement sur Misstice.'),
('nice', 'Photographe',
  'Promenade des Anglais, baie des Anges, ruelles du Vieux-Nice : les photographes niçois savent tirer parti de la lumière de la Côte d''Azur. Comparez leurs portfolios vérifiés sur Misstice.'),
('montpellier', 'Photographe',
  'L''Écusson historique et la place de la Comédie offrent un décor vivant pour vos photos. Les photographes montpelliérains vérifiés sont à comparer directement sur Misstice.'),
('rennes', 'Photographe',
  'Colombages bretons, Parlement de Bretagne, marchés animés : les photographes rennais aiment capter l''authenticité de la ville. Misstice centralise leurs portfolios et leurs devis.'),
('grenoble', 'Photographe',
  'Entourée de Belledonne, du Vercors et de la Chartreuse, Grenoble offre un cadre alpin rare pour des photos spectaculaires. Comparez les photographes vérifiés de la région sur Misstice.'),
('rouen', 'Photographe',
  'Cathédrale gothique, colombages normands, ruelles médiévales : les photographes rouennais disposent d''un décor patrimonial exceptionnel. Demandez vos devis vérifiés sur Misstice.'),
('toulon', 'Photographe',
  'Face à sa rade et sous la lumière méditerranéenne, Toulon offre des décors encore préservés du tumulte de la Côte d''Azur. Comparez les photographes vérifiés de la région sur Misstice.'),
('reims', 'Photographe',
  'Cathédrale classée à l''UNESCO, maisons de champagne, vignes à perte de vue : les photographes rémois composent des clichés à la hauteur du prestige de la ville. Comparez-les sur Misstice.'),
('saint-etienne', 'Photographe',
  'Friches industrielles réinventées et design urbain : les photographes stéphanois cultivent un style singulier, loin des clichés classiques. Misstice centralise leurs portfolios vérifiés.'),
('le-havre', 'Photographe',
  'L''architecture moderniste d''Auguste Perret, classée à l''UNESCO, offre un décor unique en France pour des photos hors des sentiers battus. Comparez les photographes havrais vérifiés sur Misstice.'),
('angers', 'Photographe',
  'Château d''Angers, bords de Maine, douceur angevine : les photographes locaux composent des clichés élégants et lumineux. Demandez vos devis gratuitement sur Misstice.'),
('dijon', 'Photographe',
  'Hôtels particuliers, toits bourguignons colorés et Climats du vignoble classés à l''UNESCO : les photographes dijonnais ont un cadre patrimonial rare à exploiter. Comparez-les sur Misstice.'),
('nimes', 'Photographe',
  'Arènes romaines, Maison Carrée, lumière du sud : Nîmes offre un décor antique unique pour des photos qui sortent de l''ordinaire. Comparez les photographes vérifiés de la région sur Misstice.')

on conflict (city_slug, category) do update set intro_text = excluded.intro_text;

-- ============================================================================
--  Contenu unique — pages ville×catégorie signalées par Search Console comme
--  quasi-identiques entre elles. Ajoute aussi une photo (+ alt text
--  ville×catégorie, pour le SEO images) par page : à défaut d'une photo
--  distincte par ville, on réutilise l'illustration du métier avec une
--  légende locale, jamais un gabarit générique identique partout.
-- ============================================================================

alter table public.city_category_content add column if not exists image_url text;
alter table public.city_category_content add column if not exists image_alt text;

insert into public.city_category_content (city_slug, category, intro_text, image_url, image_alt) values

('saint-etienne', 'Traiteur',
  'Les traiteurs référencés à Saint-Étienne sur Misstice couvrent aussi bien les réceptions familiales (mariages, anniversaires, baptêmes) que les événements professionnels dans la région stéphanoise. Beaucoup travaillent en circuit court avec des producteurs de la Loire et du Forez, un argument apprécié pour les mariages et galas locaux. Compare leurs offres, avis et disponibilités directement sur la fiche de chaque prestataire.',
  '/traiteur.png', 'Traiteur à Saint-Étienne, cuisine en circuit court du Forez — Misstice'),

('le-havre', 'Traiteur',
  'Les traiteurs référencés au Havre sur Misstice s''adressent aussi bien aux réceptions privées (mariages, anniversaires) qu''aux événements d''entreprise, nombreux dans cette ville portuaire. Beaucoup proposent des produits de la mer normands en circuit court, un atout pour les réceptions en bord de Manche ou dans le centre reconstruit classé UNESCO.',
  '/traiteur.png', 'Traiteur au Havre, produits de la mer normands — Misstice'),

('nice', 'Traiteur',
  'À Nice, les traiteurs référencés sur Misstice maîtrisent aussi bien la cuisine méditerranéenne (socca, farcis niçois) que les standards de la restauration événementielle haut de gamme, pour des réceptions allant du cocktail sur terrasse au dîner assis en villa. Compare leurs prestations et avis directement sur la plateforme.',
  '/traiteur.png', 'Traiteur à Nice, cuisine méditerranéenne — Misstice'),

('rouen', 'Traiteur',
  'Les traiteurs rouennais présents sur Misstice travaillent fréquemment avec des produits normands (cidre, produits laitiers, poisson de la Manche) pour des réceptions mariage, anniversaire ou entreprise. Leur connaissance des salles de réception locales (manoirs normands, abbayes, salles en centre historique) facilite l''organisation logistique.',
  '/traiteur.png', 'Traiteur à Rouen, gastronomie normande — Misstice'),

('paris', 'Photographe',
  'Les photographes parisiens référencés sur Misstice couvrent aussi bien les mariages dans des lieux emblématiques (jardins, hôtels particuliers, bords de Seine) que les événements corporate. Beaucoup proposent des styles variés (reportage, posé, drone) adaptés aux contraintes spécifiques de la capitale (autorisations de lieux, affluence touristique).',
  '/photographe.png', 'Photographe à Paris, entre jardins et bords de Seine — Misstice'),

('rouen', 'Photographe',
  'Les photographes rouennais référencés sur Misstice connaissent bien les lieux emblématiques de la ville (vieux Rouen, bords de Seine, abbayes normandes) pour immortaliser mariages et événements. Leur expérience locale permet d''anticiper les meilleures heures de lumière selon les saisons normandes, souvent plus changeantes qu''ailleurs.',
  '/photographe.png', 'Photographe à Rouen, entre vieux Rouen et abbayes normandes — Misstice'),

('toulouse', 'Photographe',
  'Les photographes toulousains référencés sur Misstice interviennent aussi bien sur les mariages dans les propriétés du Lauragais et du Gers voisin que sur les événements d''entreprise liés à l''écosystème aéronautique de la ville. Leur portfolio couvre généralement plusieurs styles, du reportage naturel au posé traditionnel.',
  '/photographe.png', 'Photographe à Toulouse, entre Lauragais et écosystème aéronautique — Misstice')

on conflict (city_slug, category) do update
  set intro_text = excluded.intro_text,
      image_url  = excluded.image_url,
      image_alt  = excluded.image_alt;

-- Fin.
