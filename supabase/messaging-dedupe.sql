-- ============================================================================
--  Misstice — Fusion des conversations en double + garde-fou anti-duplication.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  Une conversation = un binôme (particulier ↔ prestataire). Des doublons ont
--  pu être créés avant la mise en place de la réutilisation. On garde la plus
--  ANCIENNE, on y rattache tous les messages des doublons, puis on supprime les
--  doublons. Un index unique empêche toute nouvelle duplication.
-- ============================================================================

set check_function_bodies = off;

-- 1. Rattache les messages des doublons à la conversation conservée (la + ancienne).
update public.messages m
  set conversation_id = k.keep_id
  from (
    select id,
           first_value(id) over (
             partition by particulier_id, prestataire_id
             order by created_at asc
           ) as keep_id
    from public.conversations
  ) k
  where m.conversation_id = k.id
    and k.id <> k.keep_id;

-- 2. Supprime les conversations en double (tout sauf la conservée).
delete from public.conversations c
  using (
    select id,
           first_value(id) over (
             partition by particulier_id, prestataire_id
             order by created_at asc
           ) as keep_id
    from public.conversations
  ) k
  where c.id = k.id
    and k.id <> k.keep_id;

-- 3. Recale l'horodatage du dernier message + son aperçu sur la conversation
--    conservée (pour l'ordre et l'aperçu dans la liste).
update public.conversations c
  set last_message_at = m.max_created
  from (
    select conversation_id, max(created_at) as max_created
    from public.messages
    group by conversation_id
  ) m
  where m.conversation_id = c.id
    and m.max_created > c.last_message_at;

-- 4. Garde-fou : une seule conversation par binôme, définitivement.
create unique index if not exists conversations_pair_uniq
  on public.conversations (particulier_id, prestataire_id);

-- Fin.
