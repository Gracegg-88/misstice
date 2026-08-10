-- ============================================================================
--  Misstice — Contenu éditorial des pages "Organiser un mariage à [ville]"
--  (/mariage/[ville]) : cities.intro_text pour les 20 villes ciblées.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent (simple UPDATE).
--
--  Chaque texte est volontairement distinct dans sa structure et son
--  contenu (patrimoine, gastronomie, géographie réels de chaque ville) —
--  pas un gabarit où seul le nom de la ville change, pour éviter le
--  contenu quasi dupliqué que Google pénalise sur les pages générées en
--  masse. Aucune statistique inventée sur les origines/communautés : la
--  France ne collecte pas de statistiques ethniques, donc aucun chiffre de
--  ce type n'apparaît ici (voir échange sur ce sujet).
-- ============================================================================

update public.cities set intro_text =
  'De la Seine aux jardins à la française, Paris offre un décor à la hauteur de vos envies : hôtels particuliers, salles historiques, traiteurs étoilés ou food trucks conviviaux. La capitale accueille aussi bien un mariage traditionnel qu''une cérémonie mêlant plusieurs cultures et rites, avec des prestataires habitués à cette diversité. Misstice centralise budget, invités et devis pour que vous profitiez du jour J sans en gérer les coulisses.'
  where slug = 'paris';

update public.cities set intro_text =
  'Capitale de la gastronomie française, Lyon est une évidence pour un mariage où la table tient une place centrale : bouchons lyonnais, traiteurs gastronomiques et domaines des monts du Lyonnais se prêtent aussi bien à un repas traditionnel qu''à un menu venu d''ailleurs. Entre les traboules du Vieux Lyon et les berges du Rhône, les lieux de réception ne manquent pas de caractère. Misstice vous aide à comparer les prestataires vérifiés de la région sans multiplier les rendez-vous.'
  where slug = 'lyon';

update public.cities set intro_text =
  'Entre Vieux-Port, calanques et lumière méditerranéenne, Marseille propose des mariages en plein air toute l''année. La ville est un carrefour de traditions — cérémonies religieuses, laïques ou mixtes — et ses traiteurs savent composer des menus qui vont du couscous à la bouillabaisse. Misstice réunit vos prestataires marseillais vérifiés, votre budget et votre liste d''invités au même endroit.'
  where slug = 'marseille';

update public.cities set intro_text =
  'Sous ses façades de brique rose, Toulouse marie douceur occitane et dynamisme du sud-ouest. Cassoulet, vins de Fronton et salles de réception dans les maisons de maître toulousaines donnent le ton d''un mariage chaleureux et convivial. Avec Misstice, organisez chaque étape — checklist, devis, plan de table — sans perdre le fil entre deux visites de salle.'
  where slug = 'toulouse';

update public.cities set intro_text =
  'Vignobles alentour, façades XVIIIe classées à l''UNESCO et quartier des Chartrons : Bordeaux a tout d''une ville-décor pour un mariage entre tradition et raffinement. De nombreux domaines viticoles se transforment le temps d''un week-end en lieu de réception, avec des traiteurs habitués aux grandes tablées. Misstice vous connecte à des prestataires vérifiés de la région, du photographe au DJ.'
  where slug = 'bordeaux';

update public.cities set intro_text =
  'Ville de Loire et d''audace créative, Nantes cultive un esprit à part : ateliers d''artistes reconvertis en salles de réception, guinguettes au bord du fleuve, cuisine du terroir revisitée. C''est une ville qui se prête aussi bien à un mariage classique qu''à une cérémonie plus atypique. Misstice réunit vos prestataires nantais vérifiés et votre organisation dans un seul espace.'
  where slug = 'nantes';

update public.cities set intro_text =
  'À la croisée des cultures flamande et picarde, Lille marie briques rouges, estaminets chaleureux et proximité immédiate avec la Belgique. Ses maisons bourgeoises du Vieux-Lille et ses salles industrielles réhabilitées offrent un large choix de décors. Misstice centralise budget, invités et devis pour organiser votre mariage lillois sans stress.'
  where slug = 'lille';

update public.cities set intro_text =
  'Entre colombages alsaciens et institutions européennes, Strasbourg conjugue tradition et ouverture sur le monde. La Petite France et ses winstubs accueillent des mariages où choucroute et pain d''épices ont parfois autant leur place qu''un menu venu d''ailleurs. Misstice vous aide à comparer les prestataires vérifiés de la région, en toute transparence sur les prix.'
  where slug = 'strasbourg';

update public.cities set intro_text =
  'Avec la Promenade des Anglais et la baie des Anges en toile de fond, Nice incarne l''art de vivre méditerranéen — mariages en extérieur, réceptions face à la mer, traiteurs habitués à la cuisine niçoise comme aux menus plus exotiques. Misstice réunit vos prestataires azuréens vérifiés, votre budget et votre checklist au même endroit.'
  where slug = 'nice';

update public.cities set intro_text =
  'Ville jeune, ensoleillée et en perpétuel mouvement, Montpellier associe son Écusson historique à une scène événementielle très dynamique. De nombreux domaines viticoles des environs se louent pour des mariages en plein air, du printemps à l''automne. Avec Misstice, comparez les prestataires vérifiés de la région sans multiplier les échanges par email.'
  where slug = 'montpellier';

update public.cities set intro_text =
  'Entre colombages bretons et portes ouvertes sur la mer, Rennes séduit par son mélange de patrimoine et de modernité. Crêperies, salles de château et domaines aux alentours composent des mariages à l''image de la Bretagne : chaleureux et sans chichis. Misstice centralise vos devis, votre budget et votre liste d''invités pour un mariage rennais organisé sereinement.'
  where slug = 'rennes';

update public.cities set intro_text =
  'Nichée entre Belledonne, Vercors et Chartreuse, Grenoble offre un cadre alpin rare pour un mariage : chalets d''altitude, domaines skiables reconvertis l''été, terrasses avec vue sur les massifs. C''est une ville qui se prête aussi bien à une cérémonie en intérieur qu''à une réception en plein air. Misstice réunit vos prestataires vérifiés de la région iséroise au même endroit.'
  where slug = 'grenoble';

update public.cities set intro_text =
  'Ville de Jeanne d''Arc et de sa cathédrale gothique, Rouen marie colombages normands et gastronomie généreuse. Les demeures à pans de bois du centre historique et les domaines normands des environs offrent un cadre authentique pour un mariage. Avec Misstice, organisez budget, invités et prestataires rouennais vérifiés depuis un seul tableau de bord.'
  where slug = 'rouen';

update public.cities set intro_text =
  'Face à sa rade et bercée par la tradition navale, Toulon profite d''un littoral méditerranéen encore préservé du tumulte de la Côte d''Azur. Les collines varoises et les domaines viticoles voisins offrent de nombreuses options pour une réception en extérieur. Misstice vous aide à comparer les prestataires vérifiés de la région sans perdre de temps.'
  where slug = 'toulon';

update public.cities set intro_text =
  'Capitale du Champagne et ville du sacre des rois de France, Reims a le prestige chevillé au corps : cathédrale classée à l''UNESCO, maisons de champagne et caves séculaires qui se prêtent à merveille à une réception d''exception. Misstice centralise vos devis, votre budget et votre organisation pour profiter pleinement de ce cadre.'
  where slug = 'reims';

update public.cities set intro_text =
  'Ville UNESCO de design et ancien bassin industriel réinventé, Saint-Étienne assume un style singulier : friches réhabilitées en lieux de réception, ateliers d''artistes, décors bruts et authentiques. C''est une option pour les couples qui cherchent un mariage qui sort des sentiers battus. Misstice réunit vos prestataires stéphanois vérifiés et votre organisation au même endroit.'
  where slug = 'saint-etienne';

update public.cities set intro_text =
  'Reconstruite par Auguste Perret et classée au patrimoine mondial de l''UNESCO, Le Havre offre une architecture unique en France, ouverte sur la mer et l''estuaire de la Seine. Ses salles modernistes et ses domaines normands voisins composent des mariages entre modernité et grand air. Avec Misstice, comparez les prestataires vérifiés de la région sans multiplier les visites.'
  where slug = 'le-havre';

update public.cities set intro_text =
  'Ville de châteaux et de douceur angevine, Angers borde la Loire et son chapelet de domaines classés — dont la célèbre Tapisserie de l''Apocalypse abritée dans son château. De nombreuses demeures et parcs des environs se prêtent à des réceptions en pleine nature. Misstice centralise budget, invités et devis pour organiser votre mariage angevin sans stress.'
  where slug = 'angers';

update public.cities set intro_text =
  'Ancienne capitale des ducs de Bourgogne, Dijon marie patrimoine historique et gastronomie de renom — moutarde, vins de Bourgogne et cassis donnent le ton d''un mariage généreux à table. Ses hôtels particuliers du centre-ville et les domaines viticoles des Climats de Bourgogne, classés à l''UNESCO, offrent un large choix de décors. Misstice vous aide à comparer les prestataires vérifiés de la région, en toute transparence.'
  where slug = 'dijon';

update public.cities set intro_text =
  'Sous le soleil de l''Occitanie, Nîmes conjugue patrimoine romain — arènes et Maison Carrée — et art de vivre du sud. Ses ferias et ses domaines provençaux voisins inspirent des mariages généreux, entre traditions méditerranéennes et réceptions en plein air. Avec Misstice, organisez chaque étape de votre mariage nîmois depuis un seul espace, prestataires vérifiés inclus.'
  where slug = 'nimes';

-- Fin.
