-- ============================================================================
--  Misstice — Budget mis à jour automatiquement après acceptation d'un devis
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

alter table public.budget_expenses
  add column if not exists quote_id uuid references public.quotes (id) on delete set null;

-- Anti-doublon : si l'acceptation se déclenche deux fois pour le même devis
-- (double-clic, bug réseau), une seule dépense doit exister.
create unique index if not exists budget_expenses_quote_uniq
  on public.budget_expenses (quote_id)
  where quote_id is not null;
