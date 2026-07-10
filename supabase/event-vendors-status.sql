-- ============================================================================
--  Misstice — Statuts des prestataires d'un événement.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  Nouveau modèle : le statut d'un prestataire suit ses devis (agrégat) :
--   • « en attente » dès qu'une demande de devis est envoyée,
--   • « confirmé »   dès qu'un de ses devis est accepté (jamais rétrogradé),
--   • « refusé »     si un devis est refusé et qu'il n'est pas déjà confirmé.
--  On retire l'ancien « devis reçu ».
-- ============================================================================

set check_function_bodies = off;

-- 1. Migration des anciennes valeurs.
update public.event_vendors set status = 'en attente' where status = 'devis reçu';

-- 2. Nouvelle contrainte de statut.
alter table public.event_vendors drop constraint if exists event_vendors_status_check;
alter table public.event_vendors
  add constraint event_vendors_status_check
  check (status in ('confirmé', 'en attente', 'refusé'));

-- Fin.
