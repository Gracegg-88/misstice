-- ============================================================================
--  Misstice — « Ambiance & Vibe » sur les prestataires (filtres + badges).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de vendors (annuaire). Le prestataire renseigne lui-même ses tags
--  depuis son profil ; ils servent aux filtres et aux badges publics.
-- ============================================================================

alter table public.vendors add column if not exists moods       text[] not null default '{}';
alter table public.vendors add column if not exists energies    text[] not null default '{}';
alter table public.vendors add column if not exists lights      text[] not null default '{}';
alter table public.vendors add column if not exists palettes    text[] not null default '{}';
alter table public.vendors add column if not exists atmospheres text[] not null default '{}';
alter table public.vendors add column if not exists music_styles text[] not null default '{}';

-- Fin.
