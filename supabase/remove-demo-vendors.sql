-- ============================================================================
--  Misstice — Retrait DÉFINITIF des fiches prestataires de démonstration.
--  À exécuter dans Supabase → SQL Editor → Run.
--
--  ⚠️ DESTRUCTIF ET IRRÉVERSIBLE. Vérifiez le SELECT ci-dessous avant de
--  lancer le DELETE : il ne doit renvoyer QUE des fiches vitrines (jamais un
--  vrai compte prestataire — reconnaissable à user_id NULL).
--
--  Rend inutile (mais inoffensif) le trigger de retrait progressif défini
--  dans demo-cleanup.sql, qui n'aura plus rien à retirer.
-- ============================================================================

-- 1. À LANCER D'ABORD — prévisualisation, ne modifie rien.
select id, name, category, city, user_id
from public.vendors
where user_id is null
order by position asc;

-- 2. Une fois la liste ci-dessus vérifiée (aucun vrai compte dedans),
--    décommentez et lancez le bloc suivant.

-- delete from public.vendors where user_id is null;

-- Les avis, favoris et vues liés à ces fiches sont supprimés en cascade
-- automatiquement (reviews, vendor_favorites, profile_views). Les
-- références dans event_vendors / conversations passent à NULL sans
-- supprimer les événements ou conversations des vrais utilisateurs.

-- 3. À LANCER APRÈS le DELETE — doit renvoyer 0. Si c'est le cas, il ne
--    reste plus aucune fiche vitrine en base : tout ce qui subsiste dans
--    public.vendors est rattaché à un vrai compte prestataire (user_id non
--    NULL).
select count(*) as fiches_vitrines_restantes
from public.vendors
where user_id is null;

-- Fin.
