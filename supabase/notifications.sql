-- ============================================================================
--  Misstice — Notifications in-app (cloche + temps réel).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql, messaging.sql, pro.sql.
-- ============================================================================

set check_function_bodies = off;

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade, -- destinataire
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Chacun ne voit / ne gère QUE ses notifications.
drop policy if exists "notif_select" on public.notifications;
create policy "notif_select" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notif_update" on public.notifications;
create policy "notif_update" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notif_delete" on public.notifications;
create policy "notif_delete" on public.notifications
  for delete using (user_id = auth.uid());
-- Pas d'INSERT côté client : seules les fonctions SECURITY DEFINER ci-dessous
-- créent des notifications (on notifie un AUTRE utilisateur).

-- Helper interne.
create or replace function public.push_notification(
  p_user uuid, p_type text, p_title text, p_body text, p_link text
)
returns void
language sql security definer set search_path = public
as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user, p_type, p_title, p_body, p_link);
$$;

-- ── 1. Nouveau message → notifie l'AUTRE participant ────────────────────────
create or replace function public.notify_new_message()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  c public.conversations%rowtype;
  v_recipient uuid;
  v_link text;
begin
  -- Les messages « devis » sont couverts par notify_new_quote.
  if new.body ~ '^\[\[devis:' then
    return new;
  end if;
  select * into c from public.conversations where id = new.conversation_id;
  if not found then return new; end if;

  if new.sender_id = c.particulier_id then
    v_recipient := c.prestataire_id;
    v_link := '/pro/messagerie/' || c.id;
  else
    v_recipient := c.particulier_id;
    v_link := '/dashboard/messages/' || c.id;
  end if;

  perform public.push_notification(
    v_recipient, 'message', 'Nouveau message',
    left(new.body, 90), v_link
  );
  return new;
end;
$$;

drop trigger if exists on_message_notify on public.messages;
create trigger on_message_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- ── 2. Nouvelle conversation (demande) → notifie le prestataire ─────────────
create or replace function public.notify_new_conversation()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.push_notification(
    new.prestataire_id, 'demande', 'Nouvelle demande de devis',
    coalesce(new.particulier_name, 'Un client') || ' vous a contacté.',
    '/pro/demandes'
  );
  return new;
end;
$$;

drop trigger if exists on_conversation_notify on public.conversations;
create trigger on_conversation_notify
  after insert on public.conversations
  for each row execute function public.notify_new_conversation();

-- ── 3. Nouveau devis → notifie le client ────────────────────────────────────
create or replace function public.notify_new_quote()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_client uuid;
begin
  if new.conversation_id is null then return new; end if;
  select particulier_id into v_client
    from public.conversations where id = new.conversation_id;
  if v_client is null then return new; end if;

  perform public.push_notification(
    v_client, 'devis', 'Vous avez reçu un devis',
    coalesce(new.quote_number, 'Devis') || ' — ' ||
      to_char(new.amount, 'FM999G999G990D00') || ' €',
    '/devis/' || new.id
  );
  return new;
end;
$$;

drop trigger if exists on_quote_notify on public.quotes;
create trigger on_quote_notify
  after insert on public.quotes
  for each row execute function public.notify_new_quote();

-- ── 4. Devis accepté / refusé → notifie le prestataire ──────────────────────
create or replace function public.notify_quote_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = old.status then return new; end if;
  if new.status = 'accepté' then
    perform public.push_notification(
      new.prestataire_id, 'devis_accepte', 'Devis accepté 🎉',
      coalesce(new.client_name, 'Le client') || ' a accepté votre devis.',
      '/devis/' || new.id
    );
  elsif new.status = 'refusé' then
    perform public.push_notification(
      new.prestataire_id, 'devis_refuse', 'Devis refusé',
      coalesce(new.client_name, 'Le client') || ' a refusé votre devis.',
      '/devis/' || new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_quote_status_notify on public.quotes;
create trigger on_quote_status_notify
  after update of status on public.quotes
  for each row execute function public.notify_quote_status();

-- 5. Temps réel.
do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when others then null;
  end;
end $$;

-- Fin.
