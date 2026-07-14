-- ============================================================================
--  Misstice — Accusés de lecture & compteurs de messages non lus.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de messaging.sql (conversations, messages, is_conversation_participant).
-- ============================================================================

set check_function_bodies = off;

-- Dernière lecture d'une conversation par un utilisateur.
create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_reads enable row level security;

-- Les participants voient les marqueurs de la conversation (pour l'accusé « Vu »).
drop policy if exists "reads_select" on public.conversation_reads;
create policy "reads_select" on public.conversation_reads
  for select using (public.is_conversation_participant(conversation_id));

-- Chacun gère SON propre marqueur.
drop policy if exists "reads_write" on public.conversation_reads;
create policy "reads_write" on public.conversation_reads
  for all
  using (user_id = auth.uid() and public.is_conversation_participant(conversation_id))
  with check (user_id = auth.uid() and public.is_conversation_participant(conversation_id));

-- Marque une conversation comme lue (à l'ouverture du fil).
create or replace function public.mark_conversation_read(p_conv uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_conversation_participant(p_conv) then
    insert into public.conversation_reads (conversation_id, user_id, last_read_at)
    values (p_conv, auth.uid(), now())
    on conflict (conversation_id, user_id)
      do update set last_read_at = now();
  end if;
end;
$$;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Nombre de messages non lus par conversation, pour l'utilisateur courant.
create or replace function public.my_unread_counts()
returns table (conversation_id uuid, unread bigint)
language sql security definer set search_path = public stable
as $$
  select m.conversation_id, count(*)::bigint
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  left join public.conversation_reads r
    on r.conversation_id = m.conversation_id and r.user_id = auth.uid()
  where auth.uid() in (c.particulier_id, c.prestataire_id)
    and m.sender_id <> auth.uid()
    and (r.last_read_at is null or m.created_at > r.last_read_at)
  group by m.conversation_id;
$$;
grant execute on function public.my_unread_counts() to authenticated;

-- Temps réel : diffuser les marqueurs de lecture (accusé « Vu » live).
do $$
begin
  begin
    alter publication supabase_realtime add table public.conversation_reads;
  exception when others then null;
  end;
end $$;

-- Fin.
