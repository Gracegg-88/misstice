-- Mentions légales sur le devis (DGCCRF / Code de la consommation) :
-- SIRET du prestataire, snapshotté au moment de la création du devis
-- (même logique que presta_name/presta_email déjà présents).
alter table public.quotes
  add column if not exists presta_siret text,
  add column if not exists presta_company_name text;

-- Un taux de TVA à 0% (valeur par défaut du formulaire) ne veut pas dire
-- "franchise en base" — tant que ce n'est pas confirmé explicitement, le
-- devis ne doit affirmer aucun statut fiscal (voir DevisDocument.tsx).
alter table public.quotes
  add column if not exists tva_franchise boolean not null default false;
