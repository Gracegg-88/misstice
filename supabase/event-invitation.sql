-- ============================================================================
--  Misstice — Site d'invitation public + RSVP partageable (par événement).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (events) et dashboard.sql (guests).
--  Un lien unique par événement : les invités s'inscrivent eux-mêmes (oui/non)
--  sans compte. L'écriture passe par une fonction SECURITY DEFINER validée par
--  le jeton de partage (aucune écriture directe possible via RLS).
-- ============================================================================

set check_function_bodies = off;

-- Jeton de partage public de l'événement.
alter table public.events
  add column if not exists share_token uuid not null default gen_random_uuid();
-- Backfill des lignes existantes qui n'auraient pas de jeton.
update public.events set share_token = gen_random_uuid() where share_token is null;
create unique index if not exists events_share_token_idx on public.events (share_token);

-- Infos publiques de l'invitation (lues via le jeton, pas via RLS).
create or replace function public.public_event_invitation(p_token uuid)
returns table (
  event_id            uuid,
  name                text,
  event_date          date,
  event_type          text,
  host_name           text,
  invitation_card_url text
)
language sql security definer set search_path = public stable
as $$
  select e.id, e.name, e.event_date, e.type,
         coalesce(p.full_name, ''), e.invitation_card_url
  from public.events e
  left join public.profiles p on p.id = e.owner_id
  where e.share_token = p_token;
$$;
grant execute on function public.public_event_invitation(uuid) to anon, authenticated;

-- RSVP public : l'invité s'inscrit lui-même via le jeton.
create or replace function public.rsvp_public(
  p_token     uuid,
  p_name      text,
  p_email     text,
  p_status    text,
  p_plus_one  boolean
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_event uuid;
begin
  if p_status not in ('confirmé', 'décliné') then
    return false;
  end if;
  if coalesce(btrim(p_name), '') = '' then
    return false;
  end if;
  select id into v_event from public.events where share_token = p_token;
  if v_event is null then
    return false;
  end if;
  -- Anti-doublon / anti-spam : si un invité du même nom existe déjà pour cet
  -- événement, on MET À JOUR sa réponse au lieu d'empiler des lignes.
  if exists (
    select 1 from public.guests
    where event_id = v_event and lower(name) = lower(btrim(p_name))
  ) then
    update public.guests
      set status = p_status, plus_one = coalesce(p_plus_one, false)
      where event_id = v_event and lower(name) = lower(btrim(p_name));
  else
    insert into public.guests (event_id, name, email, status, plus_one)
    values (
      v_event,
      btrim(p_name),
      nullif(btrim(coalesce(p_email, '')), ''),
      p_status,
      coalesce(p_plus_one, false)
    );
  end if;
  return true;
end;
$$;
grant execute on function public.rsvp_public(uuid, text, text, text, boolean) to anon, authenticated;

-- Fin.
