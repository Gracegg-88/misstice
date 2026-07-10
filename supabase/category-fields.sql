-- ============================================================================
--  Misstice — Enrichissement des catégories de prestataire (admin).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de admin.sql (table public.vendor_categories).
--  Ajoute une description et un statut actif/désactivé (sans avatar ni branche).
-- ============================================================================

alter table public.vendor_categories
  add column if not exists description text;

alter table public.vendor_categories
  add column if not exists active boolean not null default true;

-- Fin.
