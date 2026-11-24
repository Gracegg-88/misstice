-- ============================================================================
--  Misstice — Correctif : dégradé de secours des fiches (vendors.grad)
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  PR0 (nouvelle palette) a renommé la couleur Tailwind "festif" en "garnet".
--  Mais vendors.grad stocke des fragments de classe en dur (ex. "from-violet
--  to-festif"), utilisés comme avatar de secours (fiche + favoris) quand le
--  prestataire n'a pas encore de photo. "to-festif" n'existe plus : ces
--  avatars s'affichaient sans dégradé (fond transparent). Ce correctif met à
--  jour la valeur par défaut de la colonne et les lignes existantes.
-- ============================================================================

alter table public.vendors
  alter column grad set default 'from-violet to-garnet';

update public.vendors
set grad = replace(grad, 'festif', 'garnet')
where grad like '%festif%';

-- Fin.
