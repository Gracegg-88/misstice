-- ============================================================================
--  Misstice — Messagerie in-app famille ↔ prestataire (devis + discussion).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (profiles, events) et vendors.sql (vendors).
-- ============================================================================

set check_function_bodies = off;

-- 1. Lien fiche annuaire → compte prestataire réel (null = fiche démo).
alter table public.vendors
  add column if not exists user_id uuid references public.profiles (id) on delete set null;

-- Un prestataire peut créer / gérer SA propre fiche (en plus des admins).
drop policy if exists "vendors_owner_write" on public.vendors;
create policy "vendors_owner_write" on public.vendors
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. CONVERSATIONS ─────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  particulier_id  uuid not null references public.profiles (id) on delete cascade, -- la famille
  prestataire_id  uuid not null references public.profiles (id) on delete cascade, -- le prestataire
  vendor_id       uuid references public.vendors (id) on delete set null,          -- fiche (affichage)
  vendor_name     text,
  event_id        uuid references public.events (id) on delete set null,
  subject         text,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
-- Nom du client mémorisé sur la conversation (le prestataire ne peut pas lire
-- le profil du particulier à cause du RLS → on dénormalise à la création).
alter table public.conversations
  add column if not exists particulier_name text;

-- Détails de la demande de devis (besoin, date, lieu, invités, coordonnées).
-- Servent à pré-remplir le devis côté prestataire.
alter table public.conversations
  add column if not exists demande jsonb;

-- Statut manuel de la demande (défini par le prestataire depuis le badge).
-- null = statut déduit automatiquement du devis.
alter table public.conversations
  add column if not exists status text;

-- Backfill des conversations existantes (l'éditeur SQL contourne le RLS).
update public.conversations c
  set particulier_name = p.full_name
  from public.profiles p
  where p.id = c.particulier_id
    and (c.particulier_name is null or c.particulier_name = '')
    and coalesce(p.full_name, '') <> '';

create index if not exists conversations_particulier_idx on public.conversations (particulier_id);
create index if not exists conversations_prestataire_idx on public.conversations (prestataire_id);

alter table public.conversations enable row level security;

drop policy if exists "conv_select" on public.conversations;
create policy "conv_select" on public.conversations
  for select using (auth.uid() in (particulier_id, prestataire_id));

drop policy if exists "conv_insert" on public.conversations;
create policy "conv_insert" on public.conversations
  for insert with check (auth.uid() = particulier_id);

drop policy if exists "conv_update" on public.conversations;
create policy "conv_update" on public.conversations
  for update using (auth.uid() in (particulier_id, prestataire_id));

-- 3. MESSAGES ──────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

-- Vrai si l'utilisateur courant participe à la conversation.
create or replace function public.is_conversation_participant(p_conv uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conv and auth.uid() in (c.particulier_id, c.prestataire_id)
  );
$$;

drop policy if exists "msg_select" on public.messages;
create policy "msg_select" on public.messages
  for select using (public.is_conversation_participant(conversation_id));

drop policy if exists "msg_insert" on public.messages;
create policy "msg_insert" on public.messages
  for insert with check (
    sender_id = auth.uid() and public.is_conversation_participant(conversation_id)
  );

-- 4. Bump last_message_at à chaque message (SECURITY DEFINER pour ignorer RLS).
create or replace function public.bump_conversation()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.conversations
    set last_message_at = now()
    where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute function public.bump_conversation();

-- 5. Temps réel : diffuser les nouveaux messages.
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when others then null;
  end;
end $$;

-- Fin.
