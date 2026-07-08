-- ============================================================================
--  Misstice — Collaboration : acceptation d'invitation (équipe) & RSVP invités.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (event_members, events) et dashboard.sql (guests).
-- ============================================================================

set check_function_bodies = off;

-- ── ÉQUIPE : rejoindre un événement via un lien d'invitation ────────────────
-- L'invité (connecté) réclame la ligne event_members correspondant au lien.
-- La ligne n'est prise que si elle est libre (user_id null) ou déjà à lui.
create or replace function public.accept_invitation(p_member_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_event uuid;
  v_email text;
begin
  -- SÉCURITÉ : le lien n'est pas un jeton porteur. L'invitation est liée à un
  -- email → seul le compte dont l'email correspond peut l'accepter.
  select email into v_email from auth.users where id = auth.uid();
  update public.event_members
    set user_id = auth.uid(), status = 'accepted'
    where id = p_member_id
      and (user_id is null or user_id = auth.uid())
      and lower(email) = lower(coalesce(v_email, ''))
    returning event_id into v_event;
  return v_event; -- null si lien invalide, déjà pris, ou email non concordant
end;
$$;

grant execute on function public.accept_invitation(uuid) to authenticated;

-- Infos affichées sur la page d'invitation (avant d'accepter).
create or replace function public.invitation_info(p_member_id uuid)
returns table (event_name text, member_email text, member_role text, claimed boolean)
language sql
security definer set search_path = public
stable
as $$
  select e.name, m.email, m.role, (m.user_id is not null)
  from public.event_members m
  join public.events e on e.id = m.event_id
  where m.id = p_member_id;
$$;

grant execute on function public.invitation_info(uuid) to authenticated;

-- ── INVITÉS : RSVP par lien public (sans compte) ────────────────────────────
-- NOTE : guest_rsvp_info N'EST PAS défini ici. Sa version autoritaire (avec
-- date/heure/lieu/tenue, SANS email organisateur) vit dans event-details.sql,
-- qui fait `drop function` d'abord. Une seule définition → pas de conflit de
-- type de retour ni de fuite selon l'ordre d'exécution.

-- L'invité confirme ou décline via son lien.
create or replace function public.rsvp_guest(p_guest_id uuid, p_status text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  if p_status not in ('confirmé', 'décliné') then
    return false;
  end if;
  update public.guests set status = p_status where id = p_guest_id;
  return found;
end;
$$;

grant execute on function public.rsvp_guest(uuid, text) to anon, authenticated;

-- Fin.
