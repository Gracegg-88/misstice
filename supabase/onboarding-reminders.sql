-- ============================================================================
--  Misstice — Relances d'inscription prestataire
--  Prestataires qui n'ont pas finalisé leur inscription (SIRET non vérifié
--  et/ou compte Stripe non actif) : relance J+3, J+7, puis tous les 5 jours
--  (voir /api/cron/onboarding-reminders).
--  À exécuter dans Supabase → SQL Editor → Run, APRÈS siret.sql et
--  stripe-payments.sql. Idempotent.
-- ============================================================================

-- Une ligne par prestataire relancé : nombre de relances envoyées, date de la
-- dernière et désabonnement éventuel (lien en pied de chaque email).
-- Écrite uniquement côté serveur (service role) : RLS activé SANS aucune
-- policy, donc ni lecture ni écriture possibles depuis le navigateur.
create table if not exists public.vendor_onboarding_reminders (
  vendor_profile_id uuid primary key
    references public.vendor_profiles (id) on delete cascade,
  sent_count      integer not null default 0,
  last_sent_at    timestamptz,
  unsubscribed_at timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.vendor_onboarding_reminders enable row level security;
