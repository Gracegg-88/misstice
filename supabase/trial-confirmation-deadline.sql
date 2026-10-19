-- ============================================================================
--  Misstice — Date limite de confirmation après rencontre préalable
--  (catégories requires_trial : Traiteur, Robe & Tenue, Coiffure & Maquillage).
--  À exécuter dans Supabase → SQL Editor → Run, APRÈS stripe-payments.sql.
--  Idempotent.
--
--  Problème corrigé : un devis "en attente de confirmation" dont le client ne
--  clique jamais sur "Confirmer après rencontre" restait bloqué indéfiniment
--  — le prestataire n'était jamais payé. Règle retenue pour la date limite :
--
--    deadline = MIN(date du paiement + 14 jours, date de l'événement - 7 jours)
--
--  C'est-à-dire 14 jours pour laisser le temps de la rencontre quand
--  l'événement est encore loin, mais jamais plus tard que 7 jours avant le
--  jour J (marge pour que le prestataire retrouve un client en cas de refus).
--  Si l'événement est très proche (< 7 jours après le paiement), la deadline
--  peut tomber dans le passé dès son calcul : le prochain passage du cron la
--  traitera alors comme en retard et confirmera automatiquement tout de
--  suite, ce qui est le comportement voulu (ne jamais bloquer le prestataire).
-- ============================================================================

set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Nouvelles colonnes de suivi sur quotes.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.quotes
  add column if not exists trial_confirmation_deadline date,
  add column if not exists trial_reminder_j3_sent_at timestamptz,
  add column if not exists trial_reminder_j1_sent_at timestamptz,
  add column if not exists trial_auto_confirmed boolean not null default false;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. protect_quote_payment_columns() — version définitive qui reprend
--    TOUTE la liste de stripe-payments.sql et y ajoute les 4 nouvelles
--    colonnes (même type de régression déjà rencontré et corrigé sur
--    protect_vendor_columns() et protect_quote_columns() : une redéfinition
--    qui oublie les colonnes d'un fichier précédent — voir vendor-import.sql
--    et quote-freeze-after-send.sql pour l'historique).
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
    if new.status = any(payment_statuses) and old.status is distinct from new.status then
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. mark_quote_paid — même signature, reprend tout le corps existant et
--    calcule en plus trial_confirmation_deadline pour les devis requires_trial.
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
  v_deadline date;
begin
  select presta_category into v_presta_category
    from public.quotes where id = p_quote;

  select coalesce(vc.requires_trial, false) into v_requires_trial
    from public.vendor_categories vc
    where vc.name = v_presta_category;

  v_commission    := round(p_amount * 0.15, 2);
  v_vendor_amount := p_amount - v_commission;

  -- Voir le commentaire d'en-tête de ce fichier pour la règle retenue.
  if coalesce(v_requires_trial, false) then
    v_deadline := least(p_event_date - 7, current_date + 14);
  else
    v_deadline := null;
  end if;

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
        trial_confirmation_deadline = v_deadline,
        status = case
          when coalesce(v_requires_trial, false) then 'en attente de confirmation'
          else 'en attente de réalisation'
        end
    where id = p_quote;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. auto_confirm_quote_trial — service_role uniquement, appelée par le cron
--    quand la date limite est dépassée (ou que l'événement est déjà passé)
--    sans décision du client : fait suivre le devis au cycle normal, comme
--    si le client avait cliqué "Confirmer après rencontre".
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
        trial_auto_confirmed = true
    where id = p_quote
      and status = 'en attente de confirmation';
end;
$$;

revoke all on function public.auto_confirm_quote_trial(uuid) from public, anon, authenticated;
grant execute on function public.auto_confirm_quote_trial(uuid) to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. set_quote_trial_reminder_sent — service_role uniquement, marque une
--    relance (J-3 ou J-1) comme envoyée pour ne jamais la renvoyer deux fois.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_quote_trial_reminder_sent(p_quote uuid, p_which text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_which not in ('j3', 'j1') then
    return;
  end if;

  perform set_config('misstice.stripe_check', 'on', true);

  if p_which = 'j3' then
    update public.quotes set trial_reminder_j3_sent_at = now() where id = p_quote;
  else
    update public.quotes set trial_reminder_j1_sent_at = now() where id = p_quote;
  end if;
end;
$$;

revoke all on function public.set_quote_trial_reminder_sent(uuid, text) from public, anon, authenticated;
grant execute on function public.set_quote_trial_reminder_sent(uuid, text) to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. quotes_pending_trial_confirmation — service_role uniquement, lecture
--    pour le cron (cf. app/api/cron/trial-deadline/route.ts).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.quotes_pending_trial_confirmation()
returns table (
  id uuid,
  presta_name text,
  presta_email text,
  client_name text,
  client_email text,
  event_label text,
  escrow_event_date date,
  trial_confirmation_deadline date,
  trial_reminder_j3_sent_at timestamptz,
  trial_reminder_j1_sent_at timestamptz
)
language sql security definer set search_path = public
as $$
  select id, presta_name, presta_email, client_name, client_email, event_label,
         escrow_event_date, trial_confirmation_deadline,
         trial_reminder_j3_sent_at, trial_reminder_j1_sent_at
  from public.quotes
  where status = 'en attente de confirmation';
$$;

revoke all on function public.quotes_pending_trial_confirmation() from public, anon, authenticated;
grant execute on function public.quotes_pending_trial_confirmation() to service_role;

-- Fin.
