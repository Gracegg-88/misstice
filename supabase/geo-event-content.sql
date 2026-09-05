-- ============================================================================
--  Misstice — Contenu éditorial des pages ville×événement (/[evenement]/[ville])
--  Dépend de : geo-pages.sql (tables cities, event_types).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  Une ligne ici publie la page correspondante indépendamment du nombre de
--  prestataires déjà inscrits dans la ville : un texte réellement rédigé,
--  unique par ville, est un contenu légitime à lui seul (voir échange sur
--  le contenu "thin" — le problème est le gabarit vide répété à l'identique,
--  pas l'absence de prestataires sur une page par ailleurs bien rédigée).
--  generateStaticParams (app/[evenement]/[ville]/page.tsx) publie une page
--  si CETTE table a une ligne OU si le seuil de prestataires est atteint.
-- ============================================================================

create table if not exists public.city_event_content (
  city_slug       text not null references public.cities(slug) on delete cascade,
  event_type_slug text not null references public.event_types(slug) on delete cascade,
  intro_text      text not null,
  created_at      timestamptz not null default now(),
  primary key (city_slug, event_type_slug)
);

alter table public.city_event_content enable row level security;

drop policy if exists "city_event_content_read" on public.city_event_content;
create policy "city_event_content_read" on public.city_event_content for select using (true);

drop policy if exists "city_event_content_admin_write" on public.city_event_content;
create policy "city_event_content_admin_write" on public.city_event_content
  for all using (public.is_admin()) with check (public.is_admin());

-- 20 combinaisons ville×mariage — l'événement le plus recherché, sur les 20
-- villes ciblées. Chaque texte est distinct dans sa structure et son
-- contenu (patrimoine, gastronomie, géographie réels), pas un gabarit où
-- seul le nom de la ville change. Volontairement aucune statistique sur les
-- origines/communautés (la France ne collecte pas de statistiques
-- ethniques) : le contenu s'appuie sur des faits vérifiables, jamais sur
-- des chiffres inventés.

insert into public.city_event_content (city_slug, event_type_slug, intro_text) values

('paris', 'mariage',
  'De la Seine aux jardins à la française, Paris offre un décor à la hauteur de vos envies : hôtels particuliers, salles historiques, traiteurs étoilés ou food trucks conviviaux. La capitale accueille aussi bien un mariage traditionnel qu''une cérémonie mêlant plusieurs cultures et rites, avec des prestataires habitués à cette diversité. Misstice centralise budget, invités et devis pour que vous profitiez du jour J sans en gérer les coulisses.'),

('lyon', 'mariage',
  'Capitale de la gastronomie française, Lyon est une évidence pour un mariage où la table tient une place centrale : bouchons lyonnais, traiteurs gastronomiques et domaines des monts du Lyonnais se prêtent aussi bien à un repas traditionnel qu''à un menu venu d''ailleurs. Entre les traboules du Vieux Lyon et les berges du Rhône, les lieux de réception ne manquent pas de caractère. Misstice vous aide à comparer les prestataires vérifiés de la région sans multiplier les rendez-vous.'),

('marseille', 'mariage',
  'Entre Vieux-Port, calanques et lumière méditerranéenne, Marseille propose des mariages en plein air toute l''année. La ville est un carrefour de traditions — cérémonies religieuses, laïques ou mixtes — et ses traiteurs savent composer des menus qui vont du couscous à la bouillabaisse. Misstice réunit vos prestataires marseillais vérifiés, votre budget et votre liste d''invités au même endroit.'),

('toulouse', 'mariage',
  'Sous ses façades de brique rose, Toulouse marie douceur occitane et dynamisme du sud-ouest. Cassoulet, vins de Fronton et salles de réception dans les maisons de maître toulousaines donnent le ton d''un mariage chaleureux et convivial. Avec Misstice, organisez chaque étape — checklist, devis, plan de table — sans perdre le fil entre deux visites de salle.'),

('bordeaux', 'mariage',
  'Vignobles alentour, façades XVIIIe classées à l''UNESCO et quartier des Chartrons : Bordeaux a tout d''une ville-décor pour un mariage entre tradition et raffinement. De nombreux domaines viticoles se transforment le temps d''un week-end en lieu de réception, avec des traiteurs habitués aux grandes tablées. Misstice vous connecte à des prestataires vérifiés de la région, du photographe au DJ.'),

('nantes', 'mariage',
  'Ville de Loire et d''audace créative, Nantes cultive un esprit à part : ateliers d''artistes reconvertis en salles de réception, guinguettes au bord du fleuve, cuisine du terroir revisitée. C''est une ville qui se prête aussi bien à un mariage classique qu''à une cérémonie plus atypique. Misstice réunit vos prestataires nantais vérifiés et votre organisation dans un seul espace.'),

('lille', 'mariage',
  'À la croisée des cultures flamande et picarde, Lille marie briques rouges, estaminets chaleureux et proximité immédiate avec la Belgique. Ses maisons bourgeoises du Vieux-Lille et ses salles industrielles réhabilitées offrent un large choix de décors. Misstice centralise budget, invités et devis pour organiser votre mariage lillois sans stress.'),

('strasbourg', 'mariage',
  'Entre colombages alsaciens et institutions européennes, Strasbourg conjugue tradition et ouverture sur le monde. La Petite France et ses winstubs accueillent des mariages où choucroute et pain d''épices ont parfois autant leur place qu''un menu venu d''ailleurs. Misstice vous aide à comparer les prestataires vérifiés de la région, en toute transparence sur les prix.'),

('nice', 'mariage',
  'Avec la Promenade des Anglais et la baie des Anges en toile de fond, Nice incarne l''art de vivre méditerranéen — mariages en extérieur, réceptions face à la mer, traiteurs habitués à la cuisine niçoise comme aux menus plus exotiques. Misstice réunit vos prestataires azuréens vérifiés, votre budget et votre checklist au même endroit.'),

('montpellier', 'mariage',
  'Ville jeune, ensoleillée et en perpétuel mouvement, Montpellier associe son Écusson historique à une scène événementielle très dynamique. De nombreux domaines viticoles des environs se louent pour des mariages en plein air, du printemps à l''automne. Avec Misstice, comparez les prestataires vérifiés de la région sans multiplier les échanges par email.'),

('rennes', 'mariage',
  'Entre colombages bretons et portes ouvertes sur la mer, Rennes séduit par son mélange de patrimoine et de modernité. Crêperies, salles de château et domaines aux alentours composent des mariages à l''image de la Bretagne : chaleureux et sans chichis. Misstice centralise vos devis, votre budget et votre liste d''invités pour un mariage rennais organisé sereinement.'),

('grenoble', 'mariage',
  'Nichée entre Belledonne, Vercors et Chartreuse, Grenoble offre un cadre alpin rare pour un mariage : chalets d''altitude, domaines skiables reconvertis l''été, terrasses avec vue sur les massifs. C''est une ville qui se prête aussi bien à une cérémonie en intérieur qu''à une réception en plein air. Misstice réunit vos prestataires vérifiés de la région iséroise au même endroit.'),

('rouen', 'mariage',
  'Ville de Jeanne d''Arc et de sa cathédrale gothique, Rouen marie colombages normands et gastronomie généreuse. Les demeures à pans de bois du centre historique et les domaines normands des environs offrent un cadre authentique pour un mariage. Avec Misstice, organisez budget, invités et prestataires rouennais vérifiés depuis un seul tableau de bord.'),

('toulon', 'mariage',
  'Face à sa rade et bercée par la tradition navale, Toulon profite d''un littoral méditerranéen encore préservé du tumulte de la Côte d''Azur. Les collines varoises et les domaines viticoles voisins offrent de nombreuses options pour une réception en extérieur. Misstice vous aide à comparer les prestataires vérifiés de la région sans perdre de temps.'),

('reims', 'mariage',
  'Capitale du Champagne et ville du sacre des rois de France, Reims a le prestige chevillé au corps : cathédrale classée à l''UNESCO, maisons de champagne et caves séculaires qui se prêtent à merveille à une réception d''exception. Misstice centralise vos devis, votre budget et votre organisation pour profiter pleinement de ce cadre.'),

('saint-etienne', 'mariage',
  'Ville UNESCO de design et ancien bassin industriel réinventé, Saint-Étienne assume un style singulier : friches réhabilitées en lieux de réception, ateliers d''artistes, décors bruts et authentiques. C''est une option pour les couples qui cherchent un mariage qui sort des sentiers battus. Misstice réunit vos prestataires stéphanois vérifiés et votre organisation au même endroit.'),

('le-havre', 'mariage',
  'Reconstruite par Auguste Perret et classée au patrimoine mondial de l''UNESCO, Le Havre offre une architecture unique en France, ouverte sur la mer et l''estuaire de la Seine. Ses salles modernistes et ses domaines normands voisins composent des mariages entre modernité et grand air. Avec Misstice, comparez les prestataires vérifiés de la région sans multiplier les visites.'),

('angers', 'mariage',
  'Ville de châteaux et de douceur angevine, Angers borde la Loire et son chapelet de domaines classés — dont la célèbre Tapisserie de l''Apocalypse abritée dans son château. De nombreuses demeures et parcs des environs se prêtent à des réceptions en pleine nature. Misstice centralise budget, invités et devis pour organiser votre mariage angevin sans stress.'),

('dijon', 'mariage',
  'Ancienne capitale des ducs de Bourgogne, Dijon marie patrimoine historique et gastronomie de renom — moutarde, vins de Bourgogne et cassis donnent le ton d''un mariage généreux à table. Ses hôtels particuliers du centre-ville et les domaines viticoles des Climats de Bourgogne, classés à l''UNESCO, offrent un large choix de décors. Misstice vous aide à comparer les prestataires vérifiés de la région, en toute transparence.'),

('nimes', 'mariage',
  'Sous le soleil de l''Occitanie, Nîmes conjugue patrimoine romain — arènes et Maison Carrée — et art de vivre du sud. Ses ferias et ses domaines provençaux voisins inspirent des mariages généreux, entre traditions méditerranéennes et réceptions en plein air. Avec Misstice, organisez chaque étape de votre mariage nîmois depuis un seul espace, prestataires vérifiés inclus.')

on conflict (city_slug, event_type_slug) do update set intro_text = excluded.intro_text;

-- ============================================================================
--  Contenu unique — pages ville×événement signalées par Search Console comme
--  quasi-identiques entre elles (mariage/marseille, montpellier, nantes,
--  nice, rennes) et nouvelles combinaisons hors mariage (anniversaire,
--  baptême, gala) jusque-là sans contenu éditorial dédié. Ajoute aussi une
--  photo (+ alt text ville×événement, pour le SEO images) par page : à
--  défaut d'une photo distincte par ville, on réutilise l'illustration du
--  type d'événement avec une légende locale, jamais un gabarit générique
--  identique partout.
-- ============================================================================

alter table public.city_event_content add column if not exists image_url text;
alter table public.city_event_content add column if not exists image_alt text;

insert into public.city_event_content (city_slug, event_type_slug, intro_text, image_url, image_alt) values

('marseille', 'mariage',
  'Un mariage à Marseille peut se dérouler face à la Méditerranée, dans une bastide des calanques ou un domaine viticole de la Provence toute proche. Misstice sélectionne des prestataires marseillais habitués à ces cadres : traiteurs pour cocktails en extérieur, photographes maîtrisant la lumière du sud, wedding planners connaissant les lieux emblématiques (Château Borély, îles du Frioul, domaines des Baux).',
  '/mariage.png', 'Mariage à Marseille, entre Vieux-Port et calanques — Misstice'),

('montpellier', 'mariage',
  'Montpellier séduit les mariés pour son climat méditerranéen et ses domaines viticoles du Pic Saint-Loup ou de la Camargue toute proche. Misstice met en relation avec des prestataires montpelliérains habitués aux mariages en extérieur, aux réceptions dans les mas viticoles, et à la logistique propre au climat du sud (chaleur, mistral occasionnel).',
  '/mariage.png', 'Mariage à Montpellier, dans un domaine viticole du Pic Saint-Loup — Misstice'),

('nantes', 'mariage',
  'À Nantes, les mariages profitent souvent du cadre atypique de l''île de Nantes, des châteaux de la Loire à proximité, ou des domaines viticoles du Muscadet. Misstice référence des prestataires nantais habitués à ces lieux variés, du château historique au lieu industriel réhabilité, avec une vraie connaissance de la logistique locale (accès, parkings, saisonnalité).',
  '/mariage.png', 'Mariage à Nantes, sur l''île de Nantes et ses lieux atypiques — Misstice'),

('nice', 'mariage',
  'Un mariage à Nice profite d''un cadre exceptionnel entre mer et collines : villas avec vue, jardins méditerranéens, domaines de l''arrière-pays niçois. Misstice sélectionne des prestataires habitués à ce type de réception haut de gamme, avec une attention particulière à la gestion de la chaleur estivale et à la proximité de nombreux lieux de réception prestigieux.',
  '/mariage.png', 'Mariage à Nice, entre mer et collines de la baie des Anges — Misstice'),

('rennes', 'mariage',
  'Rennes et sa région (vallée de la Vilaine, châteaux bretons) offrent un cadre à la fois historique et verdoyant pour un mariage. Misstice met en avant des prestataires rennais habitués aux mariages en manoir ou en longère bretonne, avec une bonne connaissance des contraintes météo locales et des solutions de repli en intérieur.',
  '/mariage.png', 'Mariage à Rennes, dans un manoir breton — Misstice'),

('saint-etienne', 'anniversaire',
  'Organiser un anniversaire à Saint-Étienne, c''est profiter d''une ville à taille humaine où salles de réception, traiteurs et animateurs sont facilement accessibles depuis le centre-ville ou les quartiers de Bellevue et Terrasse. Que tu prépares un anniversaire d''enfant dans un parc comme celui de l''Europe, ou une soirée entre adultes dans un lieu atypique du quartier Manufacture, Misstice te met en relation avec des prestataires stéphanois qui connaissent les spécificités locales : disponibilité des salles, parkings, contraintes de bruit en centre-ville.',
  '/anniversaire.png', 'Anniversaire à Saint-Étienne, entre Bellevue et quartier Manufacture — Misstice'),

('marseille', 'bapteme',
  'À Marseille, un baptême se prépare souvent avec vue sur mer ou dans l''un des nombreux domaines provençaux des environs (Aubagne, Aix, la Côte Bleue). La ville offre un vivier de traiteurs habitués aux grandes tablées familiales et aux journées qui s''étirent du déjeuner au dîner. Misstice référence des prestataires marseillais rompus aux codes du baptême méditerranéen : buffet généreux, decoration extérieure, logistique adaptée à la chaleur en saison.',
  '/bapteme.png', 'Baptême à Marseille, réception face à la Méditerranée — Misstice'),

('reims', 'gala',
  'Reims, capitale du Champagne, est un cadre naturel pour un gala d''entreprise ou de charité : demeures de maisons de Champagne, salons classés, domaines viticoles en périphérie. Misstice met en avant des prestataires rémois habitués aux événements corporate haut de gamme — traiteurs gastronomiques, DJ et régie technique pour soirées de plusieurs centaines d''invités, souvent en lien avec le secteur du vin et du champagne local.',
  '/gala.png', 'Gala d''entreprise à Reims, au cœur du vignoble champenois — Misstice'),

('toulon', 'gala',
  'À Toulon, l''organisation d''un gala profite souvent du cadre maritime : terrasses avec vue sur la rade, salles de réception en bord de mer, domaines dans l''arrière-pays varois. Misstice connecte les organisateurs avec des prestataires toulonnais habitués aux contraintes spécifiques de la ville (vent, accès aux lieux en bord de mer, saisonnalité touristique) pour des soirées d''entreprise ou de gala associatif réussies.',
  '/gala.png', 'Gala à Toulon, réception face à la rade — Misstice')

on conflict (city_slug, event_type_slug) do update
  set intro_text = excluded.intro_text,
      image_url  = excluded.image_url,
      image_alt  = excluded.image_alt;

-- Fin.
