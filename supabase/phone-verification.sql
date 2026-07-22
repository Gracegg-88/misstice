-- ============================================================================
--  Misstice — Vérification téléphone (statut explicite)
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

-- `phone` existe déjà (texte libre, non vérifié — supabase/profile-extras.sql).
-- Cette colonne marque explicitement qu'un numéro a été VÉRIFIÉ par OTP (et
-- pas juste renseigné), posée par le code applicatif au moment de la
-- vérification réussie (app/creer/page.tsx, components/PhoneVerification.tsx).
alter table public.profiles
  add column if not exists phone_verified_at timestamptz;
