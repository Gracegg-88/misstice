-- ============================================================================
--  Misstice — Super-admin & gestion des administrateurs.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de admin.sql (is_admin, admin_set_role…).
--
--  • Un « super-admin » (can_manage_admins = true) peut inviter / gérer les
--    autres administrateurs.
--  • Le(s) admin(s) actuel(s) sont promus super-admin par cette migration.
-- ============================================================================

set check_function_bodies = off;

-- 1. Drapeau super-admin sur les profils.
alter table public.profiles
  add column if not exists can_manage_admins boolean not null default false;

-- 2. Les administrateurs EXISTANTS deviennent super-admins.
update public.profiles set can_manage_admins = true where role = 'admin';

-- 3. Helper : l'utilisateur courant est-il super-admin ?
create or replace function public.is_super_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and can_manage_admins = true
  );
$$;

-- 4. Liste des administrateurs (email + état) — réservée aux super-admins.
create or replace function public.admin_list_admins()
returns table (
  id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  banned boolean,
  can_manage_admins boolean
)
language sql security definer set search_path = public stable
as $$
  select p.id, p.full_name, u.email::text, p.created_at,
         (u.banned_until is not null and u.banned_until > now()) as banned,
         p.can_manage_admins
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_super_admin() and p.role = 'admin'
  order by p.created_at asc;
$$;
grant execute on function public.admin_list_admins() to authenticated;

-- 5. Promouvoir un compte en administrateur (utilisé après création du compte
--    invité). Réservé aux super-admins ; interdit l'auto-ciblage.
create or replace function public.sadmin_promote(p_target uuid, p_can_manage boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Action impossible sur son propre compte';
  end if;
  update public.profiles
    set role = 'admin', can_manage_admins = coalesce(p_can_manage, false)
    where id = p_target;
end;
$$;
grant execute on function public.sadmin_promote(uuid, boolean) to authenticated;

-- 6. Accorder / retirer le droit de gérer les admins.
create or replace function public.sadmin_set_manage(p_target uuid, p_can_manage boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Action impossible sur son propre compte';
  end if;
  update public.profiles set can_manage_admins = coalesce(p_can_manage, false)
    where id = p_target and role = 'admin';
end;
$$;
grant execute on function public.sadmin_set_manage(uuid, boolean) to authenticated;

-- 7. Retirer les droits d'administration (repasse en particulier).
create or replace function public.sadmin_revoke_admin(p_target uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Action impossible sur son propre compte';
  end if;
  update public.profiles set role = 'particulier', can_manage_admins = false
    where id = p_target;
end;
$$;
grant execute on function public.sadmin_revoke_admin(uuid) to authenticated;

-- 7b. On retire l'ancien changeur de rôle générique : un admin ne doit PAS
--     pouvoir transformer un particulier en prestataire (ou inversement).
--     Les seuls changements de rôle autorisés passent par les fonctions
--     super-admin ci-dessus (promotion / révocation d'administrateur).
drop function if exists public.admin_set_role(uuid, text);

-- 8. Suspendre / réactiver un administrateur (bloque la connexion).
create or replace function public.sadmin_set_banned(p_target uuid, p_banned boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Non autorisé';
  end if;
  if p_target = auth.uid() then
    raise exception 'Action impossible sur son propre compte';
  end if;
  update auth.users
    set banned_until = case when p_banned then now() + interval '100 years' else null end
    where id = p_target;
end;
$$;
grant execute on function public.sadmin_set_banned(uuid, boolean) to authenticated;

-- Fin.
