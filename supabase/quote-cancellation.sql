-- ============================================================================
--  Misstice — Politique d'annulation : statuts 'annulé' / 'en litige' + lecture
--  admin sur les devis (pour la médiation en cas de litige).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de pro.sql, admin.sql.
-- ============================================================================

-- 1. Élargit les statuts autorisés sur les devis.
alter table public.quotes drop constraint if exists quotes_status_check;
alter table public.quotes
  add constraint quotes_status_check
  check (status in ('envoyé', 'accepté', 'refusé', 'expiré', 'annulé', 'en litige'));

-- 2. L'admin peut lire tous les devis (nécessaire pour agir en médiateur en
--    cas de litige — contrairement aux événements, les devis sont des
--    documents commerciaux, pas des données privées de planification).
drop policy if exists "quotes_admin_read" on public.quotes;
create policy "quotes_admin_read" on public.quotes
  for select using (public.is_admin());

-- Fin.
