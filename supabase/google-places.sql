-- ============================================================================
--  Misstice — Lien entre une fiche prestataire et sa fiche Google.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent (rejouable).
--  ⚠️ NON EXÉCUTÉ en production : à lancer après validation.
--
--  Pourquoi SEULEMENT le place_id (et pas la note ni le nombre d'avis) :
--  les conditions Google Maps Platform interdisent de stocker ou mettre en
--  cache le contenu Places (note, nombre d'avis, avis…) ; seul le place_id
--  peut être conservé sans limite de durée. Pour un compte de facturation
--  dans l'EEE, l'API Places n'est en outre autorisée que pour une liste
--  fermée d'usages qui n'inclut pas l'affichage de notes de tiers ; le
--  « Places UI Kit » (composant d'affichage officiel Google) en est exempté.
--  La note est donc affichée en direct par le composant Google sur la fiche
--  (components/google/GooglePlaceCard.tsx), jamais copiée dans notre base,
--  et jamais mélangée à vendors.rating / vendors.reviews (avis Misstice).
--  Voir docs/google-places.md.
-- ============================================================================

alter table public.vendors
  add column if not exists google_place_id text,
  -- 'a_valider' : proposé par le prestataire, en attente de l'admin.
  -- 'valide'    : validé par l'admin → affiché sur la fiche publique.
  add column if not exists google_place_status text,
  add column if not exists google_place_linked_at timestamptz,
  -- 'admin' ou 'prestataire' : qui a proposé le lien.
  add column if not exists google_place_linked_by text,
  -- Dernière vérification que le place_id existe toujours (cron mensuel
  -- /api/cron/google-place-ids, recommandé par Google ; appel gratuit).
  add column if not exists google_place_checked_at timestamptz;

alter table public.vendors
  drop constraint if exists vendors_google_place_status_check;
alter table public.vendors
  add constraint vendors_google_place_status_check
  check (google_place_status is null or google_place_status in ('a_valider', 'valide'));

alter table public.vendors
  drop constraint if exists vendors_google_place_linked_by_check;
alter table public.vendors
  add constraint vendors_google_place_linked_by_check
  check (google_place_linked_by is null or google_place_linked_by in ('admin', 'prestataire'));

comment on column public.vendors.google_place_id is
  'Identifiant Google Places (seule donnée Google stockable sans limite). Jamais la note ni les avis.';

-- Protection : le navigateur (propriétaire de la fiche) ne peut jamais écrire
-- ces colonnes directement. Seuls un admin et le serveur (service role, via
-- /api/vendor/google-place et /api/admin/google-places) les modifient — ce
-- qui garantit qu'un prestataire ne peut pas s'auto-valider un lien vers la
-- fiche Google d'une autre entreprise.
-- SECURITY INVOKER (par défaut) : current_user est le rôle de l'appelant.
-- Seuls les rôles du navigateur (authenticated, anon) sont bridés ; le service
-- role (routes serveur) et l'éditeur SQL (postgres) écrivent librement.
create or replace function public.protect_vendor_google_columns()
returns trigger
language plpgsql set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.google_place_id        := null;
    new.google_place_status    := null;
    new.google_place_linked_at := null;
    new.google_place_linked_by := null;
    new.google_place_checked_at := null;
  else
    new.google_place_id        := old.google_place_id;
    new.google_place_status    := old.google_place_status;
    new.google_place_linked_at := old.google_place_linked_at;
    new.google_place_linked_by := old.google_place_linked_by;
    new.google_place_checked_at := old.google_place_checked_at;
  end if;
  return new;
end;
$$;

drop trigger if exists vendors_protect_google on public.vendors;
create trigger vendors_protect_google
  before insert or update on public.vendors
  for each row execute function public.protect_vendor_google_columns();
