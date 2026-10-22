-- ============================================================================
--  Misstice — Acompte versé au prestataire avant l'événement.
--  À exécuter dans Supabase → SQL Editor → Run, APRÈS trial-confirmation-
--  deadline.sql (dépend de son protect_quote_payment_columns(), mark_quote_paid,
--  decide_quote_trial, auto_confirm_quote_trial, quotes_eligible_for_release).
--  Idempotent.
--
--  Contexte : un traiteur refuse de s'inscrire sans un acompte garanti à la
--  réservation (il doit acheter les denrées avant l'événement). Chaque
--  prestataire choisit son pourcentage d'acompte (0 à 50 %), avec une valeur
--  par défaut selon sa catégorie, ajustable par devis.
--
--  Règles retenues (validées avec l'équipe Misstice) :
--   • Acompte = pourcentage choisi × 85 % du montant total (la part
--     prestataire après commission, jamais sur le montant brut).
--   • Catégories requires_trial (Traiteur, Robe & Tenue...) : versé à la
--     confirmation après rencontre (clic client OU auto-confirmation du cron
--     trial-deadline) — PAS avant, pour ne jamais verser un acompte sur une
--     prestation qui sera finalement annulée après la dégustation/l'essayage.
--   • Autres catégories : versé 5 jours après le paiement (cf. décision avec
--     l'équipe — assez tôt pour que le prestataire prépare l'événement, assez
--     tard pour laisser passer une éventuelle fraude/contestation bancaire).
--     Si l'événement est trop proche pour que ce délai s'écoule avant, le
--     cron de libération (release-funds) verse tout en une fois le jour venu
--     — rien à gérer de spécial, voir quotes_eligible_for_release ci-dessous.
--   • Acompte non remboursable au client en cas d'annulation volontaire (ni
--     code ni mécanisme de remboursement volontaire n'existe aujourd'hui en
--     dehors de « annuler après rencontre », qui a lieu AVANT tout versement
--     d'acompte — donc rien à changer côté decide_quote_trial).
--   • EXCEPTION, indépendante de la règle ci-dessus : si le prestataire ne se
--     présente pas du tout (dispute_reason = 'prestataire_absent'), le client
--     doit être intégralement remboursé même si l'acompte est déjà parti —
--     géré par `reverse_transfer: true` sur le remboursement Stripe (voir
--     app/api/stripe/dispute/file/route.ts et app/api/admin/dispute/resolve/
--     route.ts), rendu possible par `source_transaction` sur le virement
--     d'acompte (voir app/api/cron/deposit-payout/route.ts). Rien à faire ici
--     côté SQL pour ce point : resolve_quote_dispute reste inchangé.
-- ============================================================================

set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Pourcentage d'acompte par défaut, par catégorie (0 par défaut = pas
--    d'acompte). Les noms ci-dessous correspondent à la taxonomie réelle
--    (vendor-categories.sql) — « Wedding planner » → « Wedding / Event
--    planner », « Photographe / vidéaste » → les deux catégories séparées
--    « Photographe » et « Vidéaste » (pas de fusion dans la taxonomie).
--    « Robe & Tenue » est la catégorie requires_trial ajoutée par
--    stripe-payments.sql (distincte de « Robe & Tenue de mariée »).
-- ─────────────────────────────────────────────────────────────────────────
alter table public.vendor_categories
  add column if not exists default_deposit_percent numeric not null default 0
    check (default_deposit_percent >= 0 and default_deposit_percent <= 50);

update public.vendor_categories
  set default_deposit_percent = 50
  where name in ('Traiteur', 'Robe & Tenue');

update public.vendor_categories
  set default_deposit_percent = 30
  where name in (
    'Wedding / Event planner', 'Photographe', 'Vidéaste', 'DJ & Sono',
    'Fleuriste', 'Décoration'
  );

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Pourcentage choisi par le prestataire (0 à 50 %) — null = suit le
--    défaut de sa catégorie. Colonne libre comme `company`/`about` : pas de
--    donnée confirmée par Stripe, le prestataire l'écrit directement (RLS
--    "vendor_write_own" existante, aucune fonction dédiée nécessaire).
-- ─────────────────────────────────────────────────────────────────────────
alter table public.vendor_profiles
  add column if not exists deposit_percent numeric
    check (deposit_percent is null or (deposit_percent >= 0 and deposit_percent <= 50));

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Colonnes sur quotes.
--    deposit_percent, tasting_option/price/date : contenu du devis, choisi
--    par le prestataire avant envoi — gelées par protect_quote_columns()
--    comme le reste du contenu contractuel (voir section 4).
--    deposit_amount/due_at/paid_at/transfer_id, stripe_charge_id : données
--    de paiement, écrites uniquement par nos fonctions SECURITY DEFINER via
--    le drapeau misstice.stripe_check — gelées par
--    protect_quote_payment_columns() (voir section 5).
-- ─────────────────────────────────────────────────────────────────────────
alter table public.quotes
  add column if not exists deposit_percent numeric not null default 0
    check (deposit_percent >= 0 and deposit_percent <= 50),
  add column if not exists deposit_amount numeric,
  add column if not exists deposit_due_at timestamptz,
  add column if not exists deposit_paid_at timestamptz,
  add column if not exists deposit_transfer_id text,
  add column if not exists stripe_charge_id text,
  add column if not exists tasting_option text
    check (tasting_option in ('incluse', 'payante', 'non_proposee')),
  add column if not exists tasting_price numeric,
  add column if not exists tasting_date date;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. protect_quote_columns() — reprend l'intégralité du corps de
--    quote-freeze-after-send.sql (ne JAMAIS redéfinir cette fonction sans
--    repartir de sa version la plus récente : security.sql puis
--    stripe-payments.sql puis quote-freeze-after-send.sql ont chacun ajouté
--    des colonnes qu'une redéfinition partielle aurait fait régresser — déjà
--    arrivé deux fois, voir les commentaires de ces fichiers). On ajoute ici
--    deposit_percent, tasting_option, tasting_price, tasting_date aux DEUX
--    branches (famille, et prestataire après envoi).
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
    new.deposit_percent      := old.deposit_percent;
    new.tasting_option       := old.tasting_option;
    new.tasting_price        := old.tasting_price;
    new.tasting_date         := old.tasting_date;
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
    new.deposit_percent        := old.deposit_percent;
    new.tasting_option         := old.tasting_option;
    new.tasting_price          := old.tasting_price;
    new.tasting_date           := old.tasting_date;
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. protect_quote_payment_columns() — reprend l'intégralité du corps de
--    trial-confirmation-deadline.sql, ajoute deposit_amount, deposit_due_at,
--    deposit_paid_at, deposit_transfer_id, stripe_charge_id.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.protect_quote_payment_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  payment_statuses text[] := array[
    'payé', 'en attente de confirmation', 'en attente de réalisation',
    'fonds libérés'
  ];
begin
  if public.is_admin() then
    return new;
  end if;
  if current_setting('misstice.stripe_check', true) is distinct from 'on' then
    new.stripe_checkout_session_id := old.stripe_checkout_session_id;
    new.stripe_payment_intent_id   := old.stripe_payment_intent_id;
    new.stripe_charge_id           := old.stripe_charge_id;
    new.commission_amount          := old.commission_amount;
    new.vendor_amount              := old.vendor_amount;
    new.paid_at                    := old.paid_at;
    new.requires_trial             := old.requires_trial;
    new.trial_decided_at           := old.trial_decided_at;
    new.transfer_id                := old.transfer_id;
    new.funds_released_at          := old.funds_released_at;
    new.dispute_reason             := old.dispute_reason;
    new.dispute_comment            := old.dispute_comment;
    new.dispute_filed_at           := old.dispute_filed_at;
    new.dispute_resolved_at        := old.dispute_resolved_at;
    new.escrow_event_date          := old.escrow_event_date;
    new.trial_confirmation_deadline := old.trial_confirmation_deadline;
    new.trial_reminder_j3_sent_at   := old.trial_reminder_j3_sent_at;
    new.trial_reminder_j1_sent_at   := old.trial_reminder_j1_sent_at;
    new.trial_auto_confirmed        := old.trial_auto_confirmed;
    new.deposit_amount               := old.deposit_amount;
    new.deposit_due_at               := old.deposit_due_at;
    new.deposit_paid_at              := old.deposit_paid_at;
    new.deposit_transfer_id          := old.deposit_transfer_id;
    if new.status = any(payment_statuses) and old.status is distinct from new.status then
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. mark_quote_paid — NOUVELLE signature (ajout de p_charge_id, nécessaire
--    pour `source_transaction` sur le virement d'acompte — voir l'en-tête de
--    ce fichier). Reprend le corps de trial-confirmation-deadline.sql et
--    calcule en plus le montant et, pour les catégories hors rencontre
--    préalable, la date de versement de l'acompte.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.mark_quote_paid(
  p_quote uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_charge_id text,
  p_amount numeric,
  p_event_date date
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_presta_category text;
  v_deposit_percent numeric;
  v_requires_trial boolean;
  v_commission numeric;
  v_vendor_amount numeric;
  v_deposit_amount numeric;
  v_trial_deadline date;
  v_deposit_due_at timestamptz;
begin
  select presta_category, deposit_percent into v_presta_category, v_deposit_percent
    from public.quotes where id = p_quote;

  select coalesce(vc.requires_trial, false) into v_requires_trial
    from public.vendor_categories vc
    where vc.name = v_presta_category;

  v_commission    := round(p_amount * 0.15, 2);
  v_vendor_amount := p_amount - v_commission;
  v_deposit_amount := round(v_vendor_amount * (coalesce(v_deposit_percent, 0) / 100), 2);

  -- Voir trial-confirmation-deadline.sql pour la règle de deadline.
  if coalesce(v_requires_trial, false) then
    v_trial_deadline := least(p_event_date - 7, current_date + 14);
    -- Acompte versé à la confirmation après rencontre, pas avant : la date
    -- de versement sera fixée par decide_quote_trial/auto_confirm_quote_trial.
    v_deposit_due_at := null;
  else
    v_trial_deadline := null;
    v_deposit_due_at := case when v_deposit_amount > 0 then now() + interval '5 days' else null end;
  end if;

  perform set_config('misstice.stripe_check', 'on', true);

  update public.quotes
    set stripe_checkout_session_id = p_session_id,
        stripe_payment_intent_id   = p_payment_intent_id,
        stripe_charge_id           = p_charge_id,
        amount                     = p_amount,
        commission_amount          = v_commission,
        vendor_amount              = v_vendor_amount,
        deposit_amount             = v_deposit_amount,
        deposit_due_at             = v_deposit_due_at,
        paid_at                    = now(),
        requires_trial              = coalesce(v_requires_trial, false),
        escrow_event_date          = p_event_date,
        trial_confirmation_deadline = v_trial_deadline,
        status = case
          when coalesce(v_requires_trial, false) then 'en attente de confirmation'
          else 'en attente de réalisation'
        end
    where id = p_quote;
end;
$$;

revoke all on function public.mark_quote_paid(uuid, text, text, numeric, date) from public, anon, authenticated;
revoke all on function public.mark_quote_paid(uuid, text, text, text, numeric, date) from public, anon, authenticated;
grant execute on function public.mark_quote_paid(uuid, text, text, text, numeric, date) to service_role;
drop function if exists public.mark_quote_paid(uuid, text, text, numeric, date);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. decide_quote_trial — reprend le corps de stripe-payments.sql, ajoute :
--    à la confirmation (p_confirmed = true), si un acompte est dû, fixe sa
--    date de versement à maintenant (repris par le prochain passage du cron
--    deposit-payout — voir l'en-tête de ce fichier pour la règle).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.decide_quote_trial(p_quote uuid, p_confirmed boolean)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_conv uuid;
  v_status text;
begin
  select conversation_id, status into v_conv, v_status
    from public.quotes where id = p_quote;

  if v_conv is null or not public.is_conversation_participant(v_conv) then
    return false;
  end if;
  if v_status is distinct from 'en attente de confirmation' then
    return false;
  end if;

  perform set_config('misstice.stripe_check', 'on', true);

  update public.quotes
    set status = case when p_confirmed then 'en attente de réalisation' else 'annulé' end,
        trial_decided_at = now(),
        deposit_due_at = case
          when p_confirmed and deposit_amount > 0 and deposit_due_at is null then now()
          else deposit_due_at
        end
    where id = p_quote;

  return true;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 8. auto_confirm_quote_trial — même ajout que decide_quote_trial ci-dessus.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.auto_confirm_quote_trial(p_quote uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('misstice.stripe_check', 'on', true);

  update public.quotes
    set status = 'en attente de réalisation',
        trial_decided_at = now(),
        trial_auto_confirmed = true,
        deposit_due_at = case
          when deposit_amount > 0 and deposit_due_at is null then now()
          else deposit_due_at
        end
    where id = p_quote
      and status = 'en attente de confirmation';
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 9. set_quote_deposit_transfer — service_role uniquement. Enregistre le
--    virement d'acompte une fois effectué (voir app/api/cron/deposit-payout).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_quote_deposit_transfer(p_quote uuid, p_transfer_id text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('misstice.stripe_check', 'on', true);

  update public.quotes
    set deposit_paid_at = now(),
        deposit_transfer_id = p_transfer_id
    where id = p_quote;
end;
$$;

revoke all on function public.set_quote_deposit_transfer(uuid, text) from public, anon, authenticated;
grant execute on function public.set_quote_deposit_transfer(uuid, text) to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 10. quotes_eligible_for_deposit — service_role uniquement. Devis dont
--     l'acompte est dû (date de versement passée, pas encore versé). Couvre
--     les deux cas : catégories hors rencontre (deposit_due_at = paiement +
--     5 jours, fixée par mark_quote_paid) et catégories à rencontre
--     (deposit_due_at = maintenant, fixée par decide_quote_trial /
--     auto_confirm_quote_trial au moment de la confirmation).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.quotes_eligible_for_deposit()
returns table (
  id uuid,
  prestataire_id uuid,
  deposit_amount numeric,
  stripe_charge_id text,
  presta_name text
)
language sql security definer set search_path = public
as $$
  select id, prestataire_id, deposit_amount, stripe_charge_id, presta_name
  from public.quotes
  where status = 'en attente de réalisation'
    and deposit_amount is not null and deposit_amount > 0
    and deposit_paid_at is null
    and deposit_due_at is not null
    and deposit_due_at <= now();
$$;

revoke all on function public.quotes_eligible_for_deposit() from public, anon, authenticated;
grant execute on function public.quotes_eligible_for_deposit() to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 11. quotes_eligible_for_release — reprend le corps de trial-confirmation-
--     deadline.sql, renvoie désormais `amount_due` = le SOLDE restant à
--     verser (vendor_amount moins l'acompte déjà versé, le cas échéant) —
--     jamais vendor_amount en totalité si un acompte est déjà parti.
--     Colonne de sortie renommée (vendor_amount → amount_due) : "create or
--     replace" refuse ce changement ("cannot change return type"), DROP
--     explicite nécessaire avant de la recréer (même piège déjà documenté
--     dans full-setup.sql).
-- ─────────────────────────────────────────────────────────────────────────
drop function if exists public.quotes_eligible_for_release();

create or replace function public.quotes_eligible_for_release()
returns table (
  id uuid,
  prestataire_id uuid,
  amount_due numeric,
  presta_name text
)
language sql security definer set search_path = public
as $$
  select id, prestataire_id,
         vendor_amount - case when deposit_paid_at is not null then coalesce(deposit_amount, 0) else 0 end as amount_due,
         presta_name
  from public.quotes
  where status = 'en attente de réalisation'
    and escrow_event_date is not null
    and escrow_event_date + interval '72 hours' <= now();
$$;

revoke all on function public.quotes_eligible_for_release() from public, anon, authenticated;
grant execute on function public.quotes_eligible_for_release() to service_role;

-- Fin.
