-- ============================================================================
--  Misstice — Carte d'invitation personnalisée (une par événement).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  L'organisateur téléverse sa carte (image, Cloudinary) ; on la stocke sur
--  l'événement et on l'affiche dans l'email RSVP (avec Accepter / Décliner).
-- ============================================================================

alter table public.events
  add column if not exists invitation_card_url text;

-- guest_rsvp_info enrichi avec la carte (remplace la version de security.sql).
-- ⚠️ À exécuter APRÈS security.sql (sinon security.sql la ré-écrase sans la carte).
drop function if exists public.guest_rsvp_info(uuid);
create or replace function public.guest_rsvp_info(p_guest_id uuid)
returns table (
  guest_name text,
  event_name text,
  status     text,
  event_date date,
  event_time text,
  location   text,
  dress_code text,
  plus_one   boolean,
  invitation_card_url text
)
language sql security definer set search_path = public stable
as $$
  select g.name, e.name, g.status,
         e.event_date, e.event_time, e.location, e.dress_code, g.plus_one,
         e.invitation_card_url
  from public.guests g
  join public.events e on e.id = g.event_id
  where g.id = p_guest_id;
$$;
grant execute on function public.guest_rsvp_info(uuid) to anon, authenticated;

-- Fin.
