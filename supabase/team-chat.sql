-- ============================================================================
--  Misstice — Chat de groupe « Équipe » (par événement).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (events, event_members, can_access_event, profiles).
--  Tous les membres d'un événement (propriétaire + collaborateurs acceptés)
--  peuvent lire ET écrire : aucune permission de section n'est requise ici.
-- ============================================================================

set check_function_bodies = off;

-- 1. MESSAGES D'ÉQUIPE ───────────────────────────────────────────────────────
-- Le nom / l'avatar de l'expéditeur sont dénormalisés (les profils ne sont pas
-- lisibles entre membres à cause du RLS) — renseignés par post_team_message.
create table if not exists public.team_messages (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  sender_id     uuid not null references public.profiles (id) on delete cascade,
  sender_name   text,
  sender_avatar text,
  body          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists team_messages_event_idx
  on public.team_messages (event_id, created_at);

alter table public.team_messages enable row level security;

-- Lecture : tout membre de l'équipe (propriétaire ou collaborateur accepté).
drop policy if exists "team_msg_select" on public.team_messages;
create policy "team_msg_select" on public.team_messages
  for select using (public.can_access_event(event_id));

-- Pas de policy INSERT : l'écriture passe UNIQUEMENT par post_team_message
-- (SECURITY DEFINER) qui garantit un nom / avatar fiables (anti-usurpation).

-- 2. POSTER UN MESSAGE ────────────────────────────────────────────────────────
create or replace function public.post_team_message(p_event uuid, p_body text)
returns public.team_messages
language plpgsql security definer set search_path = public
as $$
declare
  v_row public.team_messages;
begin
  if not public.can_access_event(p_event) then
    raise exception 'forbidden';
  end if;
  if coalesce(btrim(p_body), '') = '' then
    raise exception 'empty';
  end if;
  insert into public.team_messages (event_id, sender_id, sender_name, sender_avatar, body)
  select p_event, auth.uid(), p.full_name, p.avatar_url, p_body
  from public.profiles p
  where p.id = auth.uid()
  returning * into v_row;
  return v_row;
end;
$$;
grant execute on function public.post_team_message(uuid, text) to authenticated;

-- 3. ACCUSÉS DE LECTURE (par événement) ───────────────────────────────────────
create table if not exists public.team_reads (
  event_id     uuid not null references public.events (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.team_reads enable row level security;

drop policy if exists "team_reads_select" on public.team_reads;
create policy "team_reads_select" on public.team_reads
  for select using (public.can_access_event(event_id));

drop policy if exists "team_reads_write" on public.team_reads;
create policy "team_reads_write" on public.team_reads
  for all
  using (user_id = auth.uid() and public.can_access_event(event_id))
  with check (user_id = auth.uid() and public.can_access_event(event_id));

create or replace function public.mark_team_read(p_event uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if public.can_access_event(p_event) then
    insert into public.team_reads (event_id, user_id, last_read_at)
    values (p_event, auth.uid(), now())
    on conflict (event_id, user_id)
      do update set last_read_at = now();
  end if;
end;
$$;
grant execute on function public.mark_team_read(uuid) to authenticated;

-- 4. LISTE DES ÉQUIPES (une par événement de l'utilisateur) ───────────────────
-- Affichée seulement si l'événement a au moins un collaborateur OU des messages
-- (inutile d'afficher « Équipe » pour un organisateur seul sans activité).
create or replace function public.my_team_threads()
returns table (
  event_id   uuid,
  event_name text,
  last_body  text,
  last_at    timestamptz,
  unread     bigint
)
language sql security definer set search_path = public stable
as $$
  select
    e.id,
    e.name,
    (select tm.body from public.team_messages tm
       where tm.event_id = e.id order by tm.created_at desc limit 1),
    coalesce(
      (select max(tm.created_at) from public.team_messages tm where tm.event_id = e.id),
      e.created_at
    ),
    (select count(*) from public.team_messages tm
       left join public.team_reads tr
         on tr.event_id = e.id and tr.user_id = auth.uid()
       where tm.event_id = e.id
         and tm.sender_id <> auth.uid()
         and (tr.last_read_at is null or tm.created_at > tr.last_read_at)
    )::bigint
  from public.events e
  where public.can_access_event(e.id)
    and (
      exists (select 1 from public.event_members m where m.event_id = e.id)
      or exists (select 1 from public.team_messages tm where tm.event_id = e.id)
    );
$$;
grant execute on function public.my_team_threads() to authenticated;

-- 5. Temps réel : diffuser les nouveaux messages d'équipe.
do $$
begin
  begin
    alter publication supabase_realtime add table public.team_messages;
  exception when others then null;
  end;
end $$;

-- Fin.
