-- Mentions légales sur le devis (DGCCRF / Code de la consommation) :
-- SIRET du prestataire, snapshotté au moment de la création du devis
-- (même logique que presta_name/presta_email déjà présents).
alter table public.quotes
  add column if not exists presta_siret text,
  add column if not exists presta_company_name text;
