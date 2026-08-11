-- ============================================================================
--  Misstice — Paiement Stripe Connect Express : onboarding prestataire,
--  paiement client avec split (85 % prestataire / 15 % commission), séquestre
--  et litiges.
--  À exécuter dans Supabase → SQL Editor → Run, APRÈS siret.sql,
--  quote-details.sql, quote-cancellation.sql, event-vendors-status.sql.
--  Idempotent.
--
--  Principe de sécurité (même motif que set_siret_verification dans
--  siret.sql) : aucune colonne liée à l'argent n'est jamais écrite en direct
--  par un client ou un prestataire, quelle que soit la policy RLS en place
--  sur la ligne. Toute écriture passe par une fonction SECURITY DEFINER
--  dédiée, qui active le drapeau de session `misstice.stripe_check` le temps
--  de l'opération — un trigger BEFORE UPDATE réinitialise sinon ces colonnes
--  à leur valeur précédente.
-- ============================================================================

set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Catégories nécessitant une rencontre/essai avant confirmation du
--    paiement (dégustation traiteur, essayage tenue, essai coiffure-
--    maquillage). Ajout des deux catégories manquantes à la taxonomie.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.vendor_categories
  add column if not exists requires_trial boolean not null default false;

insert into public.vendor_categories (name, position, requires_trial)
values
  ('Robe & Tenue', 9, true),
  ('Coiffure & Maquillage', 10, true)
on conflict (name) do nothing;

update public.vendor_categories
  set requires_trial = true
  where name in ('Traiteur', 'Robe & Tenue', 'Coiffure & Maquillage');

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Statut Stripe Express du prestataire — vendor_profiles (source de
--    vérité) + copie sur vendors (dénormalisée, même motif que `verified`,
--    pour que l'annuaire public filtre sans jointure).
-- ─────────────────────────────────────────────────────────────────────────
alter table public.vendor_profiles
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_status text not null default 'non_demarre'
    check (stripe_onboarding_status in ('non_demarre', 'en_attente', 'actif')),
  add column if not exists payouts_enabled boolean not null default false;

alter table public.vendors
  add column if not exists payouts_enabled boolean not null default false;

-- Protection : le prestataire peut tout lire, mais jamais écrire directement
-- ces 3 colonnes (elles ne reflètent que ce que Stripe confirme par webhook).
create or replace function public.protect_vendor_profile_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if current_setting('misstice.siret_check', true) is distinct from 'on' then
    new.siret_verified_at  := old.siret_verified_at;
    new.siret_company_name := old.siret_company_name;
  end if;
  if current_setting('misstice.stripe_check', true) is distinct from 'on' then
    new.stripe_account_id       := old.stripe_account_id;
    new.stripe_onboarding_status := old.stripe_onboarding_status;
    new.payouts_enabled         := old.payouts_enabled;
  end if;
  return new;
end;
$$;

-- protect_vendor_columns() (vendors) : même extension pour payouts_enabled.
create or replace function public.protect_vendor_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  new.position       := old.position;
  new.response_rate  := old.response_rate;
  new.response_hours := old.response_hours;
  if current_setting('misstice.siret_check', true) is distinct from 'on' then
    new.verified := old.verified;
  end if;
  if current_setting('misstice.stripe_check', true) is distinct from 'on' then
    new.payouts_enabled := old.payouts_enabled;
  end if;
  if current_setting('misstice.rating_sync', true) is distinct from 'on' then
    new.rating  := old.rating;
    new.reviews := old.reviews;
  end if;
  return new;
end;
$$;

-- Écriture réservée au service_role (appelée depuis le webhook Stripe
-- Next.js, jamais par un utilisateur connecté).
create or replace function public.set_stripe_account_status(
  p_profile_id uuid,
  p_account_id text,
  p_status text,
  p_payouts_enabled boolean
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('misstice.stripe_check', 'on', true);

  update public.vendor_profiles
    set stripe_account_id        = coalesce(p_account_id, stripe_account_id),
        stripe_onboarding_status = p_status,
        payouts_enabled          = p_payouts_enabled
    where id = p_profile_id;

  update public.vendors
    set payouts_enabled = p_payouts_enabled
    where user_id = p_profile_id;
end;
$$;

revoke all on function public.set_stripe_account_status(uuid, text, text, boolean) from public;
grant execute on function public.set_stripe_account_status(uuid, text, text, boolean) to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Paiement, séquestre et litige — colonnes sur quotes.
--    escrow_event_date : date de référence du séquestre, figée au moment du
--    paiement (celle qui a servi à autoriser le paiement côté Next.js —
--    /api/stripe/checkout/create). PAS `quotes.event_date` (texte saisi par
--    le prestataire dans le document, peut différer) ni une re-résolution
--    via conversations.event_id (pas toujours renseigné) : cette colonne
--    est la seule source fiable pour la fenêtre de litige et le cron de
--    libération des fonds, une fois qu'un paiement a eu lieu.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.quotes
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists commission_amount numeric,
  add column if not exists vendor_amount numeric,
  add column if not exists paid_at timestamptz,
  add column if not exists requires_trial boolean not null default false,
  add column if not exists trial_decided_at timestamptz,
  add column if not exists transfer_id text,
  add column if not exists funds_released_at timestamptz,
  add column if not exists dispute_reason text
    check (dispute_reason in ('prestataire_absent', 'insatisfaction_qualite')),
  add column if not exists dispute_filed_at timestamptz,
  add column if not exists dispute_resolved_at timestamptz,
  add column if not exists escrow_event_date date;

alter table public.quotes drop constraint if exists quotes_status_check;
alter table public.quotes
  add constraint quotes_status_check
  check (status in (
    'envoyé', 'accepté', 'refusé', 'expiré', 'annulé', 'en litige',
    'payé', 'en attente de confirmation', 'en attente de réalisation',
    'fonds libérés'
  ));

-- Protection : ni le prestataire (propriétaire de la ligne, cf. quotes_update
-- dans pro.sql) ni le client ne peuvent écrire ces colonnes ou faire
-- transiter `status` vers un état de paiement directement — seules nos
-- fonctions SECURITY DEFINER ci-dessous, via le drapeau de session, le
-- peuvent.
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
    new.commission_amount          := old.commission_amount;
    new.vendor_amount              := old.vendor_amount;
    new.paid_at                    := old.paid_at;
    new.requires_trial             := old.requires_trial;
    new.trial_decided_at           := old.trial_decided_at;
    new.transfer_id                := old.transfer_id;
    new.funds_released_at          := old.funds_released_at;
    new.dispute_reason             := old.dispute_reason;
    new.dispute_filed_at           := old.dispute_filed_at;
    new.dispute_resolved_at        := old.dispute_resolved_at;
    new.escrow_event_date          := old.escrow_event_date;
    if new.status = any(payment_statuses) and old.status is distinct from new.status then
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists quotes_protect_payment on public.quotes;
create trigger quotes_protect_payment
  before update on public.quotes
  for each row execute function public.protect_quote_payment_columns();

-- ─────────────────────────────────────────────────────────────────────────
-- 3bis. protect_quote_columns() (security.sql) gèle déjà `amount` pour
--       quiconque n'est pas auth.uid() = prestataire_id — donc aussi pour le
--       webhook Stripe (service_role, aucun auth.uid()). mark_quote_paid a
--       besoin d'écrire `amount` (avec le montant réellement encaissé par
--       Stripe) : on ajoute la même exception `misstice.stripe_check` que
--       les autres colonnes protégées, uniquement pour cette colonne — le
--       reste du devis (contenu contractuel) reste gelé comme avant.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.protect_quote_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is distinct from new.prestataire_id then
    -- Gèle tout sauf status (et id).
    new.prestataire_id  := old.prestataire_id;
    new.conversation_id := old.conversation_id;
    new.client_name     := old.client_name;
    new.event_label     := old.event_label;
    if current_setting('misstice.stripe_check', true) is distinct from 'on' then
      new.amount := old.amount;
    end if;
    new.created_at      := old.created_at;
    new.quote_number    := old.quote_number;
    new.validity_days   := old.validity_days;
    new.intro_message   := old.intro_message;
    new.event_need      := old.event_need;
    new.event_date      := old.event_date;
    new.event_location  := old.event_location;
    new.guests_count    := old.guests_count;
    new.client_email    := old.client_email;
    new.client_phone    := old.client_phone;
    new.client_address  := old.client_address;
    new.service_fee     := old.service_fee;
    new.tax_rate        := old.tax_rate;
    new.items           := old.items;
    new.presta_name     := old.presta_name;
    new.presta_category := old.presta_category;
    new.presta_email    := old.presta_email;
    new.presta_phone    := old.presta_phone;
    new.presta_address  := old.presta_address;
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. mark_quote_paid — appelée par le webhook Stripe (checkout.session.
--    completed), service_role uniquement. Calcule le split 85/15 sur
--    p_amount = le montant RÉELLEMENT encaissé par Stripe (session.
--    amount_total), jamais recalculé depuis quotes.amount : cette colonne
--    n'est qu'une copie dénormalisée écrite à chaque sauvegarde du devis
--    (cf. DevisForm.tsx), pas garantie synchrone avec les lignes au moment
--    du paiement. Détermine aussi si la catégorie du prestataire nécessite
--    une rencontre préalable.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.mark_quote_paid(
  p_quote uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_amount numeric,
  p_event_date date
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_presta_category text;
  v_requires_trial boolean;
  v_commission numeric;
  v_vendor_amount numeric;
begin
  select presta_category into v_presta_category
    from public.quotes where id = p_quote;

  select coalesce(vc.requires_trial, false) into v_requires_trial
    from public.vendor_categories vc
    where vc.name = v_presta_category;

  v_commission    := round(p_amount * 0.15, 2);
  v_vendor_amount := p_amount - v_commission;

  perform set_config('misstice.stripe_check', 'on', true);

  update public.quotes
    set stripe_checkout_session_id = p_session_id,
        stripe_payment_intent_id   = p_payment_intent_id,
        amount                     = p_amount,
        commission_amount          = v_commission,
        vendor_amount              = v_vendor_amount,
        paid_at                    = now(),
        requires_trial              = coalesce(v_requires_trial, false),
        escrow_event_date          = p_event_date,
        status = case
          when coalesce(v_requires_trial, false) then 'en attente de confirmation'
          else 'en attente de réalisation'
        end
    where id = p_quote;
end;
$$;

revoke all on function public.mark_quote_paid(uuid, text, text) from public;
revoke all on function public.mark_quote_paid(uuid, text, text, numeric) from public;
revoke all on function public.mark_quote_paid(uuid, text, text, numeric, date) from public;
grant execute on function public.mark_quote_paid(uuid, text, text, numeric, date) to service_role;
drop function if exists public.mark_quote_paid(uuid, text, text);
drop function if exists public.mark_quote_paid(uuid, text, text, numeric);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. decide_quote_trial — le client confirme ou annule après la rencontre.
--    Grantée à `authenticated` (comme set_quote_status dans pro.sql) : la
--    fonction vérifie elle-même que l'appelant participe à la conversation.
--    N'effectue AUCUN remboursement : le remboursement Stripe (si annulation)
--    est fait côté Next.js AVANT d'appeler cette fonction pour enregistrer
--    le résultat.
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
        trial_decided_at = now()
    where id = p_quote;

  return true;
end;
$$;

revoke all on function public.decide_quote_trial(uuid, boolean) from public;
grant execute on function public.decide_quote_trial(uuid, boolean) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. file_quote_dispute — le client signale un problème pendant la fenêtre
--    de séquestre (jusqu'à escrow_event_date + 72h — la date réelle de
--    l'événement au moment du paiement, PAS quotes.event_date qui est un
--    champ de document saisi par le prestataire). Grantée à `authenticated` :
--    vérifie participant + fenêtre + statut + motif valide elle-même.
--    Ne rembourse rien (fait depuis Next.js) — enregistre juste le litige.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.file_quote_dispute(p_quote uuid, p_reason text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_conv uuid;
  v_status text;
  v_event_date date;
begin
  if p_reason not in ('prestataire_absent', 'insatisfaction_qualite') then
    return false;
  end if;

  select conversation_id, status, escrow_event_date into v_conv, v_status, v_event_date
    from public.quotes where id = p_quote;

  if v_conv is null or not public.is_conversation_participant(v_conv) then
    return false;
  end if;
  if v_status is distinct from 'en attente de réalisation' then
    return false;
  end if;
  if v_event_date is null
     or v_event_date + interval '72 hours' < now() then
    return false;
  end if;

  perform set_config('misstice.stripe_check', 'on', true);

  update public.quotes
    set status = 'en litige',
        dispute_reason = p_reason,
        dispute_filed_at = now()
    where id = p_quote;

  return true;
end;
$$;

revoke all on function public.file_quote_dispute(uuid, text) from public;
grant execute on function public.file_quote_dispute(uuid, text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 7. resolve_quote_dispute — service_role uniquement. Appelée depuis
--    Next.js soit automatiquement (remboursement immédiat si
--    « prestataire_absent »), soit par un admin (« insatisfaction_qualite »,
--    médiation manuelle). Le remboursement Stripe lui-même est fait avant
--    d'appeler cette fonction ; elle n'enregistre que le résultat.
--    p_refunded = false → litige rejeté, la prestation repart en attente de
--    réalisation (le cron de libération la reprendra normalement).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.resolve_quote_dispute(p_quote uuid, p_refunded boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('misstice.stripe_check', 'on', true);

  update public.quotes
    set status = case when p_refunded then 'annulé' else 'en attente de réalisation' end,
        dispute_resolved_at = now()
    where id = p_quote;
end;
$$;

revoke all on function public.resolve_quote_dispute(uuid, boolean) from public;
grant execute on function public.resolve_quote_dispute(uuid, boolean) to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 8. set_quote_transfer — service_role uniquement. Appelée par le cron de
--    libération des fonds (72h après event_date, sans litige actif).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_quote_transfer(p_quote uuid, p_transfer_id text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('misstice.stripe_check', 'on', true);

  update public.quotes
    set status = 'fonds libérés',
        transfer_id = p_transfer_id,
        funds_released_at = now()
    where id = p_quote;
end;
$$;

revoke all on function public.set_quote_transfer(uuid, text) from public;
grant execute on function public.set_quote_transfer(uuid, text) to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 9. quotes_eligible_for_release — service_role uniquement. Liste les devis
--    dont le séquestre peut être libéré (72h après escrow_event_date, sans
--    litige actif puisque le statut aurait alors changé). Le calcul de date
--    reste côté Postgres plutôt que recalculé en JS (fuseau horaire fiable).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.quotes_eligible_for_release()
returns table (
  id uuid,
  prestataire_id uuid,
  vendor_amount numeric,
  presta_name text
)
language sql security definer set search_path = public
as $$
  select id, prestataire_id, vendor_amount, presta_name
  from public.quotes
  where status = 'en attente de réalisation'
    and escrow_event_date is not null
    and escrow_event_date + interval '72 hours' <= now();
$$;

revoke all on function public.quotes_eligible_for_release() from public;
grant execute on function public.quotes_eligible_for_release() to service_role;

-- Fin.
