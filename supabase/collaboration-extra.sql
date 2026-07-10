-- ============================================================================
--  Misstice — Compléments collaboration.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

set check_function_bodies = off;

-- Organisateur (propriétaire) d'un événement : nom + email, lisible par tout
-- membre ayant accès à l'événement (le RLS empêche sinon de lire son profil).
create or replace function public.event_organizer(p_event uuid)
returns table (id uuid, full_name text, email text)
language sql security definer set search_path = public stable
as $$
  select e.owner_id, p.full_name, u.email::text
  from public.events e
  join public.profiles p on p.id = e.owner_id
  join auth.users u on u.id = e.owner_id
  where e.id = p_event and public.can_access_event(p_event);
$$;
grant execute on function public.event_organizer(uuid) to authenticated;

-- Fin.
