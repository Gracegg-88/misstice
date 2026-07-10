-- ============================================================================
--  Misstice — Lecture publique des disponibilités prestataire.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Nécessaire pour afficher « Prochaine disponibilité » sur la fiche publique.
--  (À lancer APRÈS pro.sql / security.sql pour fixer la policy de lecture.)
-- ============================================================================

drop policy if exists "availability_read" on public.vendor_availability;
create policy "availability_read" on public.vendor_availability
  for select using (true);

-- Fin.
