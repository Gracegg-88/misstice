-- ============================================================================
--  Misstice — Vérification SIRET des prestataires
--  À exécuter dans Supabase → SQL Editor → Run, APRÈS security.sql (redéfinit
--  protect_vendor_columns()). Idempotent.
-- ============================================================================

alter table public.vendor_profiles
  add column if not exists siret text,
  add column if not exists siret_verified_at timestamptz,
  add column if not exists siret_company_name text;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. protect_vendor_columns() (vendors) : `verified` reste protégé contre
--    toute modification directe par le propriétaire, SAUF quand c'est notre
--    propre vérification SIRET qui l'écrit (drapeau de session, même motif
--    que misstice.rating_sync déjà en place dans security.sql).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.protect_vendor_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  new.position       := old.position;
  new.response_rate  := old.response_rate;
  new.response_hours := old.response_hours;
  if current_setting('misstice.siret_check', true) is distinct from 'on' then
    new.verified := old.verified;
  end if;
  if current_setting('misstice.rating_sync', true) is distinct from 'on' then
    new.rating  := old.rating;
    new.reviews := old.reviews;
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Même protection sur vendor_profiles : le prestataire peut modifier
--    librement son numéro `siret` (simple saisie), mais jamais
--    `siret_verified_at` / `siret_company_name` directement — ces deux
--    colonnes ne sont écrites que par set_siret_verification() ci-dessous.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.protect_vendor_profile_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if current_setting('misstice.siret_check', true) is distinct from 'on' then
    new.siret_verified_at  := old.siret_verified_at;
    new.siret_company_name := old.siret_company_name;
  end if;
  return new;
end;
$$;

drop trigger if exists vendor_profiles_protect_update on public.vendor_profiles;
create trigger vendor_profiles_protect_update
  before update on public.vendor_profiles
  for each row execute function public.protect_vendor_profile_columns();

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Écriture du résultat de vérification — RÉSERVÉE au service_role
--    (jamais appelable directement par un prestataire connecté : la vraie
--    vérification a lieu côté serveur Next.js, qui appelle cette fonction
--    seulement après avoir confirmé le SIRET via l'API du gouvernement).
--    p_verified = true  → SIRET valide : enregistre + active le badge.
--    p_verified = false → SIRET n'est plus valide (recheck) : retire le
--    badge et efface la vérification, mais laisse `siret` en place pour
--    référence/affichage de l'erreur.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_siret_verification(
  p_profile_id uuid,
  p_siret text,
  p_verified boolean,
  p_company_name text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('misstice.siret_check', 'on', true);

  update public.vendor_profiles
    set siret = coalesce(p_siret, siret),
        siret_verified_at = case when p_verified then now() else null end,
        siret_company_name = case when p_verified then p_company_name else null end
    where id = p_profile_id;

  update public.vendors
    set verified = p_verified
    where user_id = p_profile_id;
end;
$$;

revoke all on function public.set_siret_verification(uuid, text, boolean, text) from public;
grant execute on function public.set_siret_verification(uuid, text, boolean, text) to service_role;
