-- ============================================================================
--  Misstice — Promouvoir un compte en ADMINISTRATEUR (super-admin).
--  À exécuter dans Supabase → SQL Editor → Run.
--
--  ⚠️ À lancer UNIQUEMENT APRÈS que la personne a créé son compte
--     (l'inscription crée d'abord un profil « particulier » ; ce script le
--     passe en admin — le trigger d'inscription interdit de créer un admin
--     directement, par sécurité).
--
--  Dépend de : full-setup.sql (colonnes role + can_manage_admins sur profiles).
-- ============================================================================

update public.profiles p
set role = 'admin',
    can_manage_admins = true          -- super-admin : peut gérer les autres admins
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('ggraceheritage@gmail.com');

-- Vérification (doit renvoyer 1 ligne avec role = 'admin').
select p.id, u.email, p.role, p.can_manage_admins
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('ggraceheritage@gmail.com');

-- Fin.
