-- ============================================================================
--  Misstice — Badge "Nouveau" (relecture manuelle admin des fiches prestataire)
--  À exécuter dans Supabase → SQL Editor → Run, APRÈS security.sql (redéfinit
--  protect_vendor_columns() / protect_vendor_insert()). Idempotent.
-- ============================================================================

alter table public.vendors
  add column if not exists reviewed_at timestamptz;

-- ─────────────────────────────────────────────────────────────────────────
-- `reviewed_at` suit la même logique que `verified` : le propriétaire ne
-- peut jamais la modifier lui-même, seul un admin (via l'UI /admin) le
-- peut — pas de nouveau drapeau de session nécessaire, is_admin() suffit
-- (contrairement au SIRET, il n'y a pas de vérification serveur externe
-- à orchestrer ici, juste une action manuelle de l'admin).
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
  new.reviewed_at    := old.reviewed_at;
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

create or replace function public.protect_vendor_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.verified    := false;
    new.rating      := 0;
    new.reviews     := 0;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;
