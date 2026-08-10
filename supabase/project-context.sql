-- Contexte projet visible par le prestataire dans une conversation.
--
-- Avant acceptation d'un devis lié à la conversation : titre de
-- l'événement, date, budget prévisionnel uniquement.
-- Après acceptation : + lieu, nombre d'invités, nombre de prestataires
-- déjà réservés sur l'événement.
--
-- SECURITY DEFINER car `events` n'est lisible (RLS) que par le
-- propriétaire/membre de l'événement — jamais par un prestataire. Cette
-- fonction fait exception, mais uniquement pour le prestataire de LA
-- conversation concernée, et uniquement les colonnes ci-dessous.
create or replace function public.get_conversation_project_context(
  p_conversation_id uuid
)
returns table (
  event_name text,
  event_date date,
  budget_total numeric,
  accepted boolean,
  location text,
  guest_count int,
  booked_vendors_count int
)
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_event_id uuid;
  v_accepted boolean;
begin
  select c.event_id into v_event_id
  from conversations c
  where c.id = p_conversation_id
    and c.prestataire_id = auth.uid();

  if v_event_id is null then
    return;
  end if;

  select exists (
    select 1 from quotes q
    where q.conversation_id = p_conversation_id and q.status = 'accepté'
  ) into v_accepted;

  return query
  select
    e.name,
    e.event_date,
    e.budget_total,
    v_accepted,
    case when v_accepted then e.location else null end,
    case when v_accepted then e.guest_count else null end,
    case when v_accepted then (
      select count(*)::int from event_vendors ev
      where ev.event_id = v_event_id and ev.status = 'confirmé'
    ) else 0 end
  from events e
  where e.id = v_event_id;
end;
$$;

grant execute on function public.get_conversation_project_context(uuid) to authenticated;
