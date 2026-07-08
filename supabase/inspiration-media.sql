-- ============================================================================
--  Misstice — Inspiration : distinguer image / vidéo.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

alter table public.inspiration_ideas
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image', 'video'));

-- Lien d'origine (import Pinterest/TikTok/Instagram…) : pour les vidéos non
-- lisibles en ligne, on affiche la miniature + un bouton « lecture » qui ouvre
-- ce lien source.
alter table public.inspiration_ideas
  add column if not exists source_url text;

-- Fin.
