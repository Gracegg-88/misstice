-- ============================================================================
--  Misstice — Catégories de prestataires (annuaire).
--  Liste complète des métiers qui interviennent dans l'organisation d'un
--  événement (mariage, anniversaire, baptême, gala, séminaire…).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent (on conflict).
--  Nécessite la table public.vendor_categories (voir admin.sql).
-- ============================================================================

insert into public.vendor_categories (name, position) values
  ('Lieu de réception',            1),
  ('Salle des fêtes',              2),
  ('Domaine / Château',            3),
  ('Traiteur',                     4),
  ('Food truck',                   5),
  ('Bar à cocktails / Barman',     6),
  ('Bar à bonbons / Confiseur',    7),
  ('Bar à glaces / Glacier',       8),
  ('Pâtissier / Wedding cake',     9),
  ('Photographe',                  10),
  ('Vidéaste',                     11),
  ('Photobooth / Borne photo',     12),
  ('DJ & Sono',                    13),
  ('Groupe de musique',            14),
  ('Musiciens / Chanteur',         15),
  ('Sonorisation & Technique',     16),
  ('Éclairage',                    17),
  ('Décoration',                   18),
  ('Fleuriste',                    19),
  ('Location de mobilier',         20),
  ('Location de vaisselle',        21),
  ('Location de linge / Nappage',  22),
  ('Location de tentes / Chapiteaux', 23),
  ('Location de sanitaires',       24),
  ('Wedding / Event planner',      25),
  ('Coordinateur jour J',          26),
  ('Officiant de cérémonie',       27),
  ('Animation / Animateur',        28),
  ('Magicien',                     29),
  ('Spectacle / Artistes',         30),
  ('Animations enfants',           31),
  ('Château gonflable',            32),
  ('Baby-sitting / Garde',         33),
  ('Location de jeux',             34),
  ('Casino événementiel',          35),
  ('Feu d''artifice / Pyrotechnie', 36),
  ('Maquilleur(se)',               37),
  ('Coiffeur(se)',                 38),
  ('Robe & Tenue de mariée',       39),
  ('Costume / Habillement',        40),
  ('Bijoux & Accessoires',         41),
  ('Faire-part / Papeterie',       42),
  ('Calligraphe',                  43),
  ('Cadeaux invités',              44),
  ('Transport / Navette',          45),
  ('Voiture de prestige',          46),
  ('Voiturier',                    47),
  ('Hébergement',                  48),
  ('Sécurité / Vigile',            49),
  ('Assurance événement',          50),
  ('Autre',                        51)
on conflict (name) do nothing;

-- Fin.
