-- ============================================================================
--  Misstice — Jeton RSVP par invité (correctif HIGH-8 : IDOR sur rsvp_guest).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  À lancer APRÈS collaboration.sql (qui définit rsvp_guest 2 args).
--
--  Avant : rsvp_guest(guest_id, status) accordée à anon → n'importe qui
--  connaissant un guest_id pouvait modifier la réponse d'un invité.
--  Après : un jeton (porté par le lien RSVP) est exigé pour répondre.
-- ============================================================================

set check_function_bodies = off;

-- Jeton capability, transmis uniquement dans le lien RSVP.
alter table public.guests
  add column if not exists rsvp_token uuid not null default gen_random_uuid();
update public.guests set rsvp_token = gen_random_uuid() where rsvp_token is null;

-- On retire l'ancienne fonction non protégée…
drop function if exists public.rsvp_guest(uuid, text);

-- …et on la remplace par une version exigeant le jeton.
create or replace function public.rsvp_guest(
  p_guest_id uuid,
  p_status   text,
  p_token    uuid
)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if p_status not in ('confirmé', 'décliné') then
    return false;
  end if;
  update public.guests
    set status = p_status
    where id = p_guest_id
      and rsvp_token = p_token;   -- ← contrôle anti-IDOR
  return found;
end;
$$;
grant execute on function public.rsvp_guest(uuid, text, uuid) to anon, authenticated;

-- Fin.
