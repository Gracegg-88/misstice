-- ============================================================================
--  Misstice — Devis « document » : lignes de prestation, coordonnées, totaux.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de pro.sql (table quotes) et messaging.sql (conversations).
-- ============================================================================

set check_function_bodies = off;

-- Champs du document de devis (le devis devient une fiche complète et figée).
alter table public.quotes add column if not exists quote_number   text;
alter table public.quotes add column if not exists validity_days  integer not null default 15;
alter table public.quotes add column if not exists intro_message  text;
alter table public.quotes add column if not exists event_need     text;
alter table public.quotes add column if not exists event_date     text;
alter table public.quotes add column if not exists event_location text;
alter table public.quotes add column if not exists guests_count   text;
alter table public.quotes add column if not exists client_email   text;
alter table public.quotes add column if not exists client_phone   text;
alter table public.quotes add column if not exists client_address text;
alter table public.quotes add column if not exists service_fee    numeric not null default 0;
alter table public.quotes add column if not exists tax_rate       numeric not null default 0;

-- Lignes de prestation : [{ label, description, qty, unit_price }, ...]
alter table public.quotes add column if not exists items jsonb not null default '[]'::jsonb;

-- Snapshot des coordonnées prestataire (document figé, indépendant du profil).
alter table public.quotes add column if not exists presta_name     text;
alter table public.quotes add column if not exists presta_category text;
alter table public.quotes add column if not exists presta_email    text;
alter table public.quotes add column if not exists presta_phone    text;
alter table public.quotes add column if not exists presta_address  text;

-- ── Devis accepté → jour réservé dans le calendrier du prestataire ──────────
-- SECURITY DEFINER : fonctionne que ce soit le client ou le prestataire qui
-- change le statut. N'agit que si la date du devis est au format aaaa-mm-jj.
create or replace function public.quote_booking_sync()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  d date;
begin
  if new.event_date is null or new.event_date !~ '^\d{4}-\d{2}-\d{2}$' then
    return new;
  end if;
  d := new.event_date::date;

  -- Passage à « accepté » → on réserve le jour.
  if new.status = 'accepté' and old.status is distinct from 'accepté' then
    insert into public.vendor_availability (prestataire_id, date, status)
    values (new.prestataire_id, d, 'booked')
    on conflict (prestataire_id, date) do update set status = 'booked';

  -- Sortie de « accepté » → on libère le jour, sauf si un autre devis accepté
  -- couvre déjà cette date (et seulement s'il était en statut « booked »).
  elsif old.status = 'accepté' and new.status is distinct from 'accepté' then
    if not exists (
      select 1 from public.quotes q
      where q.prestataire_id = new.prestataire_id
        and q.id <> new.id
        and q.status = 'accepté'
        and q.event_date = new.event_date
    ) then
      delete from public.vendor_availability
      where prestataire_id = new.prestataire_id and date = d and status = 'booked';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_quote_booking on public.quotes;
create trigger on_quote_booking
  after update of status on public.quotes
  for each row execute function public.quote_booking_sync();

-- ── Numéros de devis uniques (séquence dédiée, pas un count fragile) ────────
create sequence if not exists public.quote_number_seq;

create or replace function public.next_quote_number()
returns text
language sql security definer set search_path = public
as $$
  select 'DEV-' || to_char(now(), 'YYYY') || '-'
         || lpad(nextval('public.quote_number_seq')::text, 4, '0');
$$;
grant execute on function public.next_quote_number() to authenticated;

-- Index unique (non fatal si d'anciens doublons existent déjà).
do $$
begin
  create unique index if not exists quotes_quote_number_key
    on public.quotes (quote_number);
exception when others then
  raise notice 'Index unique quote_number non créé (doublons pré-existants).';
end $$;

-- Fin.
