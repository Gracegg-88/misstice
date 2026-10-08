-- ⚠️ PROPOSITION — NON EXÉCUTÉE. À valider avant de la lancer dans Supabase.
--
-- Retrait d'une fiche prestataire à la demande de l'entreprise (lien
-- « Demander le retrait ou la rectification de cette fiche »).
-- Une fiche marquée retirée disparaît de TOUTES les surfaces publiques
-- (annuaire, fiche /prestataires/[id], pages ville, section « 3 prestataires »,
-- sitemap) sans aucune modification du code : le filtre est porté par la
-- politique RLS de lecture publique. Seuls l'admin (is_admin()) et le
-- titulaire du compte lié continuent de la voir.

alter table public.vendors
  add column if not exists retire_le timestamptz,
  add column if not exists retrait_motif text;

comment on column public.vendors.retire_le is
  'Date de retrait demandé par l''entreprise. Non nul = fiche masquée du public.';

drop policy if exists "vendors_public_read" on public.vendors;
create policy "vendors_public_read" on public.vendors
  for select
  using (retire_le is null or user_id = auth.uid() or public.is_admin());

-- Pour retirer une fiche (à faire depuis l'éditeur SQL ou l'admin) :
-- update public.vendors
--   set retire_le = now(), retrait_motif = 'Demande e-mail du JJ/MM/AAAA'
--   where id = '<uuid>';
