-- ============================================================================
--  Misstice — Permissions de collaboration par section.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (events, event_members, can_access_event) et
--  dashboard.sql (checklist_tasks, guests, event_vendors, planning_moments,
--  vendor_calls, inspiration_ideas).
--
--  Principe :
--   • Le PROPRIÉTAIRE de l'événement peut tout modifier.
--   • Un MEMBRE accepté peut TOUT VOIR (lecture) mais ne peut MODIFIER que les
--     sections que le propriétaire lui a accordées (event_members.permissions).
--   • La gestion de l'équipe reste réservée au propriétaire (déjà en place via
--     members_write_owner).
-- ============================================================================

set check_function_bodies = off;

-- 1. Sections éditables accordées à un membre (clés : budget, checklist,
--    invites, prestataires, planning, inspiration).
alter table public.event_members
  add column if not exists permissions text[] not null default '{}';

-- 2. Droit d'ÉDITION d'une section pour l'utilisateur courant.
create or replace function public.can_edit_section(p_event uuid, p_section text)
returns boolean
language sql security definer set search_path = public stable
as $$
  select
    exists (
      select 1 from public.events e
      where e.id = p_event and e.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.event_members m
      where m.event_id = p_event
        and m.user_id = auth.uid()
        and m.status = 'accepted'
        and p_section = any (coalesce(m.permissions, '{}'))
    );
$$;

-- 3. Politiques : lecture pour tout membre, écriture selon la section.
--    Modèle réutilisé pour chaque table (2 policies) :
--      <t>_read  → for select using can_access_event
--      <t>_write → for all using/with check can_edit_section(section)
--    (les policies permissives se combinent en OR : le SELECT reste ouvert à
--     tous les membres, l'écriture est restreinte à la section.)

-- Budget (catégories + dépenses)
drop policy if exists "budget_cat_access" on public.budget_categories;
drop policy if exists "budget_cat_read"   on public.budget_categories;
drop policy if exists "budget_cat_write"  on public.budget_categories;
create policy "budget_cat_read" on public.budget_categories
  for select using (public.can_access_event(event_id));
create policy "budget_cat_write" on public.budget_categories
  for all using (public.can_edit_section(event_id, 'budget'))
  with check (public.can_edit_section(event_id, 'budget'));

drop policy if exists "budget_exp_access" on public.budget_expenses;
drop policy if exists "budget_exp_read"   on public.budget_expenses;
drop policy if exists "budget_exp_write"  on public.budget_expenses;
create policy "budget_exp_read" on public.budget_expenses
  for select using (public.can_access_event(event_id));
create policy "budget_exp_write" on public.budget_expenses
  for all using (public.can_edit_section(event_id, 'budget'))
  with check (public.can_edit_section(event_id, 'budget'));

-- Checklist
drop policy if exists "checklist_access" on public.checklist_tasks;
drop policy if exists "checklist_read"   on public.checklist_tasks;
drop policy if exists "checklist_write"  on public.checklist_tasks;
create policy "checklist_read" on public.checklist_tasks
  for select using (public.can_access_event(event_id));
create policy "checklist_write" on public.checklist_tasks
  for all using (public.can_edit_section(event_id, 'checklist'))
  with check (public.can_edit_section(event_id, 'checklist'));

-- Invités
drop policy if exists "guests_access" on public.guests;
drop policy if exists "guests_read"   on public.guests;
drop policy if exists "guests_write"  on public.guests;
create policy "guests_read" on public.guests
  for select using (public.can_access_event(event_id));
create policy "guests_write" on public.guests
  for all using (public.can_edit_section(event_id, 'invites'))
  with check (public.can_edit_section(event_id, 'invites'));

-- Prestataires (event_vendors + vendor_calls)
drop policy if exists "event_vendors_access" on public.event_vendors;
drop policy if exists "event_vendors_read"   on public.event_vendors;
drop policy if exists "event_vendors_write"  on public.event_vendors;
create policy "event_vendors_read" on public.event_vendors
  for select using (public.can_access_event(event_id));
create policy "event_vendors_write" on public.event_vendors
  for all using (public.can_edit_section(event_id, 'prestataires'))
  with check (public.can_edit_section(event_id, 'prestataires'));

drop policy if exists "vendor_calls_access" on public.vendor_calls;
drop policy if exists "vendor_calls_read"   on public.vendor_calls;
drop policy if exists "vendor_calls_write"  on public.vendor_calls;
create policy "vendor_calls_read" on public.vendor_calls
  for select using (public.can_access_event(event_id));
create policy "vendor_calls_write" on public.vendor_calls
  for all using (public.can_edit_section(event_id, 'prestataires'))
  with check (public.can_edit_section(event_id, 'prestataires'));

-- Planning Jour J
drop policy if exists "planning_access" on public.planning_moments;
drop policy if exists "planning_read"   on public.planning_moments;
drop policy if exists "planning_write"  on public.planning_moments;
create policy "planning_read" on public.planning_moments
  for select using (public.can_access_event(event_id));
create policy "planning_write" on public.planning_moments
  for all using (public.can_edit_section(event_id, 'planning'))
  with check (public.can_edit_section(event_id, 'planning'));

-- Inspiration (idées)
drop policy if exists "inspiration_access" on public.inspiration_ideas;
drop policy if exists "inspiration_read"   on public.inspiration_ideas;
drop policy if exists "inspiration_write"  on public.inspiration_ideas;
create policy "inspiration_read" on public.inspiration_ideas
  for select using (public.can_access_event(event_id));
create policy "inspiration_write" on public.inspiration_ideas
  for all using (public.can_edit_section(event_id, 'inspiration'))
  with check (public.can_edit_section(event_id, 'inspiration'));

-- Inspiration (fichiers dans le bucket storage) : écriture/suppression réservées
-- à la section « inspiration » ; lecture inchangée (gérée dans dashboard.sql).
drop policy if exists "inspiration_write"  on storage.objects;
drop policy if exists "inspiration_delete" on storage.objects;
create policy "inspiration_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'inspiration'
    and public.can_edit_section(((storage.foldername(name))[1])::uuid, 'inspiration')
  );
create policy "inspiration_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'inspiration'
    and public.can_edit_section(((storage.foldername(name))[1])::uuid, 'inspiration')
  );

-- Fin.
