-- ============================================================================
--  Misstice — Devis et paiements : pas de devis sans paiements Stripe actifs.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent (rejouable).
--  Dépend de pro.sql (quotes), messaging.sql (conversations),
--  stripe-payments.sql (vendor_profiles.payouts_enabled).
--
--  1. Un devis ne peut être créé que si le prestataire a payouts_enabled =
--     true (les devis sont insérés depuis le navigateur : le blocage de
--     l'interface ne suffit pas).
--  2. quote_request_alerts : date de chaque demande de devis et date d'envoi
--     des emails liés (prestataire sans Stripe, puis client après 72 h).
--     Table réservée au serveur (RLS activé, aucune policy) : seuls le
--     service role (routes API, cron) et les triggers ci-dessous y écrivent.
-- ============================================================================

set check_function_bodies = off;

-- ── 1. Devis : paiements Stripe obligatoires ────────────────────────────────
create or replace function public.quotes_require_payouts()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.vendor_profiles
    where id = new.prestataire_id and payouts_enabled = true
  ) then
    raise exception 'Activez vos paiements (10 min) pour envoyer votre devis.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists quotes_require_payouts on public.quotes;
create trigger quotes_require_payouts
  before insert on public.quotes
  for each row execute function public.quotes_require_payouts();

-- ── 2. Suivi des demandes de devis ──────────────────────────────────────────
create table if not exists public.quote_request_alerts (
  conversation_id      uuid primary key references public.conversations (id) on delete cascade,
  -- Date de la DERNIÈRE demande (une conversation peut en porter plusieurs).
  requested_at         timestamptz not null default now(),
  -- Email « activez vos paiements pour répondre » envoyé au prestataire.
  vendor_alert_sent_at timestamptz,
  -- Email « le prestataire n'a pas encore activé ses paiements » au client.
  client_alert_sent_at timestamptz
);
create index if not exists quote_request_alerts_pending_idx
  on public.quote_request_alerts (requested_at)
  where client_alert_sent_at is null;

alter table public.quote_request_alerts enable row level security;
-- Aucune policy : ni lecture ni écriture côté navigateur.

-- Chaque nouvelle demande (conversation créée avec une demande, ou demande
-- modifiée) remet le suivi à zéro : nouvelle date, emails à renvoyer.
create or replace function public.track_quote_request()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.demande is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.demande is not distinct from old.demande then
    return new;
  end if;
  insert into public.quote_request_alerts (conversation_id, requested_at)
  values (new.id, now())
  on conflict (conversation_id) do update
    set requested_at         = excluded.requested_at,
        vendor_alert_sent_at = null,
        client_alert_sent_at = null;
  return new;
end;
$$;

drop trigger if exists on_quote_request_track on public.conversations;
create trigger on_quote_request_track
  after insert or update of demande on public.conversations
  for each row execute function public.track_quote_request();

-- Pas de reprise des anciennes demandes : seules les demandes faites après
-- l'exécution de ce script déclenchent des emails (aucun client n'est
-- prévenu pour une demande ancienne).
