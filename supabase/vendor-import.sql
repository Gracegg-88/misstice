-- ============================================================================
--  Misstice — Fiches vitrines SIRENE + relance manuelle
--  À exécuter dans Supabase → SQL Editor → Run, APRÈS stripe-payments.sql
--  (redéfinit protect_vendor_columns()). Idempotent.
-- ============================================================================

alter table public.vendors
  add column if not exists claim_status text not null default 'reclamee'
    check (claim_status in ('reclamee', 'non_reclamee')),
  add column if not exists siret text,
  add column if not exists contact_email text,
  add column if not exists vues_fiche integer not null default 0,
  add column if not exists tentatives_contact integer not null default 0,
  add column if not exists last_relance_sent_at timestamptz;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. protect_vendor_columns() — version définitive qui réunit TOUTES les
--    protections posées jusqu'ici par security.sql / reviewed.sql /
--    stripe-payments.sql (chaque fichier redéfinit la fonction en entier ;
--    stripe-payments.sql avait fait régresser la protection de
--    `reviewed_at` posée par reviewed.sql en l'omettant — corrigé ici) et y
--    ajoute les nouvelles colonnes d'import SIRENE : `claim_status`, `siret`
--    et les compteurs ne sont modifiables que par un admin ou par nos
--    fonctions SECURITY DEFINER ci-dessous (drapeau de session
--    misstice.vendor_import, même motif que misstice.siret_check).
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
  if current_setting('misstice.stripe_check', true) is distinct from 'on' then
    new.payouts_enabled := old.payouts_enabled;
  end if;
  if current_setting('misstice.rating_sync', true) is distinct from 'on' then
    new.rating  := old.rating;
    new.reviews := old.reviews;
  end if;
  if current_setting('misstice.vendor_import', true) is distinct from 'on' then
    new.claim_status         := old.claim_status;
    new.siret                := old.siret;
    new.vues_fiche            := old.vues_fiche;
    new.tentatives_contact    := old.tentatives_contact;
    new.last_relance_sent_at  := old.last_relance_sent_at;
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Import — RÉSERVÉ au service_role (appelé depuis la route admin, jamais
--    depuis le client). Une ligne par entreprise importée, sans photo ni
--    description : seulement nom/ville/catégorie/SIRET, "non_reclamee".
--    Anti-doublon : si le SIRET existe déjà, ne réinsère pas (permet de
--    relancer un scan/import sur le même couple ville×catégorie sans
--    dupliquer les fiches déjà importées).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.import_sirene_vendor(
  p_name text,
  p_siret text,
  p_city text,
  p_category text
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if exists (select 1 from public.vendors where siret = p_siret) then
    return null;
  end if;

  perform set_config('misstice.vendor_import', 'on', true);

  insert into public.vendors (name, category, city, siret, claim_status, verified, payouts_enabled, user_id)
  values (p_name, p_category, p_city, p_siret, 'non_reclamee', false, false, null)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.import_sirene_vendor(text, text, text, text) from public;
grant execute on function public.import_sirene_vendor(text, text, text, text) to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Compteurs réels — ouverts à tout visiteur (comme l'insertion dans
--    profile_views), mais uniquement via ces fonctions : un UPDATE ... SET
--    x = x + 1 est atomique par ligne en Postgres (verrou de ligne
--    implicite), pas besoin d'un mécanisme plus complexe. Ne touchent
--    qu'une fiche non réclamée précise — aucune lecture, aucune donnée
--    sensible exposée.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.increment_vendor_view(p_vendor_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('misstice.vendor_import', 'on', true);
  update public.vendors
    set vues_fiche = vues_fiche + 1
    where id = p_vendor_id and claim_status = 'non_reclamee';
end;
$$;

create or replace function public.increment_vendor_contact_attempt(p_vendor_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('misstice.vendor_import', 'on', true);
  update public.vendors
    set tentatives_contact = tentatives_contact + 1
    where id = p_vendor_id and claim_status = 'non_reclamee';
end;
$$;

revoke all on function public.increment_vendor_view(uuid) from public;
grant execute on function public.increment_vendor_view(uuid) to anon, authenticated;
revoke all on function public.increment_vendor_contact_attempt(uuid) from public;
grant execute on function public.increment_vendor_contact_attempt(uuid) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Horodatage de la dernière relance envoyée — RÉSERVÉ au service_role
--    (appelé juste après l'envoi réussi de l'email, app/api/admin/sirene/
--    relance/route.ts). last_relance_sent_at est protégée par
--    protect_vendor_columns() comme les autres colonnes d'import : sans
--    cette fonction, un simple UPDATE serait silencieusement annulé.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.mark_relance_sent(p_vendor_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('misstice.vendor_import', 'on', true);
  update public.vendors
    set last_relance_sent_at = now()
    where id = p_vendor_id and claim_status = 'non_reclamee';
end;
$$;

revoke all on function public.mark_relance_sent(uuid) from public;
grant execute on function public.mark_relance_sent(uuid) to service_role;
