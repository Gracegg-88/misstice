-- ============================================================================
--  Misstice — Gèle le contenu d'un devis une fois envoyé (prestataire)
--  À exécuter dans Supabase → SQL Editor → Run, APRÈS stripe-payments.sql.
--  Idempotent.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- protect_quote_columns() — version définitive qui réunit TOUTES les
-- protections déjà posées (security.sql puis stripe-payments.sql, qui avait
-- fait régresser la protection de presta_siret/presta_company_name ajoutées
-- entre-temps par devis-mentions-legales.sql en les omettant — corrigé ici,
-- même type de régression déjà rencontré et corrigé sur
-- protect_vendor_columns(), voir supabase/vendor-import.sql), et ajoute la
-- vraie nouveauté : une fois le devis sorti du statut "envoyé" (accepté,
-- refusé, expiré, payé...), le PRESTATAIRE lui-même ne peut plus modifier
-- le contenu contractuel — jusqu'ici seule la famille en était empêchée.
-- Le statut reste modifiable (voir le sélecteur manuel dans
-- components/pro/DevisClient.tsx, fonctionnalité volontairement conservée).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.protect_quote_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if auth.uid() is distinct from new.prestataire_id then
    -- La famille (ou le webhook Stripe service_role) : gèle tout sauf status
    -- (et id). `amount` reste son exception existante pour mark_quote_paid.
    new.prestataire_id      := old.prestataire_id;
    new.conversation_id     := old.conversation_id;
    new.client_name         := old.client_name;
    new.event_label         := old.event_label;
    if current_setting('misstice.stripe_check', true) is distinct from 'on' then
      new.amount := old.amount;
    end if;
    new.created_at          := old.created_at;
    new.quote_number        := old.quote_number;
    new.validity_days       := old.validity_days;
    new.intro_message       := old.intro_message;
    new.event_need          := old.event_need;
    new.event_date          := old.event_date;
    new.event_location      := old.event_location;
    new.guests_count        := old.guests_count;
    new.client_email        := old.client_email;
    new.client_phone        := old.client_phone;
    new.client_address      := old.client_address;
    new.service_fee         := old.service_fee;
    new.tax_rate             := old.tax_rate;
    new.tva_franchise        := old.tva_franchise;
    new.items                := old.items;
    new.presta_name          := old.presta_name;
    new.presta_category      := old.presta_category;
    new.presta_email         := old.presta_email;
    new.presta_phone         := old.presta_phone;
    new.presta_address       := old.presta_address;
    new.presta_siret         := old.presta_siret;
    new.presta_company_name  := old.presta_company_name;
  elsif old.status is distinct from 'envoyé' then
    -- Le prestataire, mais le devis a déjà été transmis et traité : le
    -- contenu contractuel est figé, seul `status` peut encore bouger.
    new.conversation_id     := old.conversation_id;
    new.client_name         := old.client_name;
    new.event_label         := old.event_label;
    new.amount               := old.amount;
    new.created_at            := old.created_at;
    new.quote_number          := old.quote_number;
    new.validity_days         := old.validity_days;
    new.intro_message         := old.intro_message;
    new.event_need            := old.event_need;
    new.event_date            := old.event_date;
    new.event_location        := old.event_location;
    new.guests_count          := old.guests_count;
    new.client_email          := old.client_email;
    new.client_phone          := old.client_phone;
    new.client_address        := old.client_address;
    new.service_fee           := old.service_fee;
    new.tax_rate               := old.tax_rate;
    new.tva_franchise          := old.tva_franchise;
    new.items                  := old.items;
    new.presta_name            := old.presta_name;
    new.presta_category        := old.presta_category;
    new.presta_email           := old.presta_email;
    new.presta_phone           := old.presta_phone;
    new.presta_address         := old.presta_address;
    new.presta_siret           := old.presta_siret;
    new.presta_company_name    := old.presta_company_name;
  end if;
  return new;
end;
$$;
