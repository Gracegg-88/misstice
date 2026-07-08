-- ============================================================================
--  Misstice — Détails d'événement (heure, lieu, tenue) + RSVP enrichi.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql, dashboard.sql et collaboration.sql.
-- ============================================================================

set check_function_bodies = off;

-- 1. Champs optionnels sur l'événement.
alter table public.events
  add column if not exists event_time text,
  add column if not exists location   text,
  add column if not exists dress_code text;

-- 2. guest_rsvp_info enrichi (on remplace : la signature de retour change).
--    SÉCURITÉ : ne PAS exposer l'email de l'organisateur à anon (fuite).
drop function if exists public.guest_rsvp_info(uuid);
create or replace function public.guest_rsvp_info(p_guest_id uuid)
returns table (
  guest_name      text,
  event_name      text,
  status          text,
  event_date      date,
  event_time      text,
  location        text,
  dress_code      text,
  plus_one        boolean
)
language sql
security definer set search_path = public
stable
as $$
  select g.name, e.name, g.status,
         e.event_date, e.event_time, e.location, e.dress_code, g.plus_one
  from public.guests g
  join public.events e on e.id = g.event_id
  where g.id = p_guest_id;
$$;

grant execute on function public.guest_rsvp_info(uuid) to anon, authenticated;

-- Fin.
