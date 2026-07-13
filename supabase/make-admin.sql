-- ============================================================================
--  Misstice — Promouvoir un compte en ADMINISTRATEUR (super-admin).
--  À exécuter dans Supabase → SQL Editor → Run.
--
--  ⚠️ À lancer UNIQUEMENT APRÈS que la personne a créé son compte
--     (l'inscription crée d'abord un profil « particulier »).
--
--  Bootstrap du PREMIER admin : le trigger `freeze_profile_role` (security.sql)
--  n'autorise un changement de `role` que si l'appelant est DÉJÀ admin. Comme
--  aucun admin n'existe encore, on désactive ce trigger le temps de l'UPDATE,
--  puis on le réactive immédiatement.
--
--  Dépend de : full-setup.sql (colonnes role + can_manage_admins sur profiles).
-- ============================================================================

-- 1. On lève temporairement le verrou anti-escalade sur le rôle.
alter table public.profiles disable trigger profiles_freeze_role;

-- 2. Promotion du compte visé en admin + super-admin.
update public.profiles p
set role = 'admin',
    can_manage_admins = true
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('ggraceheritage@gmail.com');

-- 3. On réactive immédiatement le verrou (indispensable pour la sécurité).
alter table public.profiles enable trigger profiles_freeze_role;

-- 4. Vérification — doit renvoyer 1 ligne avec role = 'admin'.
select p.id, u.email, p.role, p.can_manage_admins
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('ggraceheritage@gmail.com');

-- Fin.
