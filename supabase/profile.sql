-- ============================================================================
--  Misstice — Profil : photo d'avatar (colonne + Storage)
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

-- 1. Colonne avatar_url sur les profils
alter table public.profiles
  add column if not exists avatar_url text;

-- 2. Bucket Storage public pour les avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Policies Storage : lecture publique, chaque utilisateur gère son dossier
--    (chemin attendu : avatars/<user_id>/fichier.png)
drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Fin.
