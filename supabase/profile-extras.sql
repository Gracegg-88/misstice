-- ============================================================================
--  Misstice — Champs profil supplémentaires (données newsletter / relances).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (table public.profiles).
-- ============================================================================

alter table public.profiles
  add column if not exists birthdate date;

alter table public.profiles
  add column if not exists phone text;

alter table public.profiles
  add column if not exists newsletter_opt_in boolean not null default true;

-- Fin.
