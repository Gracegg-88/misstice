-- ============================================================================
--  Misstice — PR1.5a : lien court, suivi des sources, carte partageable
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

-- 1. LIEN COURT — slug unique par prestataire (misstice.com/p/[slug]).
--    Généré côté application (lib/slug.ts) à la création de la fiche, jamais
--    régénéré ensuite (un lien déjà partagé doit rester valide). Les comptes
--    déjà créés avant cette PR reçoivent un slug de secours ici (à partir du
--    nom de leur activité), pour que "Générer sa carte" et le partage
--    fonctionnent aussi pour eux.
alter table public.vendor_profiles
  add column if not exists slug text;

-- Backfill des comptes existants (slug encore vide) : normalisation simple en
-- SQL (accents non traités aussi finement que lib/slug.ts côté JS, mais
-- suffisant pour un lien existant ; un futur renommage ne change pas le
-- slug, comme pour tout le monde).
with base as (
  select
    id,
    regexp_replace(
      regexp_replace(lower(coalesce(nullif(trim(company), ''), 'prestataire')), '[^a-z0-9]+', '-', 'g'),
      '(^-+)|(-+$)', '', 'g'
    ) as candidate
  from public.vendor_profiles
  where slug is null
),
ranked as (
  select id, candidate,
    row_number() over (partition by candidate order by id) as rn
  from base
)
update public.vendor_profiles vp
set slug = case when r.rn = 1 then r.candidate else r.candidate || '-' || r.rn::text end
from ranked r
where vp.id = r.id;

alter table public.vendor_profiles drop constraint if exists vendor_profiles_slug_key;
alter table public.vendor_profiles add constraint vendor_profiles_slug_key unique (slug);

-- 2. SUIVI DES SOURCES — canal d'où vient un visiteur / un client.
alter table public.profile_views
  add column if not exists source text;

alter table public.conversations
  add column if not exists source text;

-- Fin.
