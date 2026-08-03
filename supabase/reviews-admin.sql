-- ============================================================================
--  Misstice — Gestion des avis par l'admin (item 10 de la feuille de route)
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

-- Jusqu'ici seul l'auteur d'un avis pouvait le supprimer ; on ajoute l'admin,
-- pour modérer un avis inapproprié sans dépendre de l'auteur.
drop policy if exists "reviews_delete" on public.reviews;
create policy "reviews_delete" on public.reviews
  for delete using (author_id = auth.uid() or public.is_admin());
