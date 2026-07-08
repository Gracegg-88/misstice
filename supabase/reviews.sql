-- ============================================================================
--  Misstice — Avis clients (laissés par les particuliers uniquement).
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Dépend de schema.sql (profiles) et vendors.sql (vendors).
-- ============================================================================

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  author_name text,
  rating      integer not null check (rating between 1 and 5),
  event_type  text,
  body        text,
  created_at  timestamptz not null default now(),
  unique (vendor_id, author_id) -- un seul avis par personne et par prestataire
);
create index if not exists reviews_vendor_idx on public.reviews (vendor_id, created_at desc);

alter table public.reviews enable row level security;

-- Lecture publique (les avis sont affichés sur la fiche).
drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews for select using (true);

-- Seuls les PARTICULIERS peuvent déposer un avis (sur leur propre compte).
drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'particulier'
    )
  );

-- Chacun gère son propre avis.
drop policy if exists "reviews_update" on public.reviews;
create policy "reviews_update" on public.reviews
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "reviews_delete" on public.reviews;
create policy "reviews_delete" on public.reviews
  for delete using (author_id = auth.uid());

-- ── Synchronisation vendors.rating / vendors.reviews ────────────────────────
-- Les cartes de l'annuaire lisent ces colonnes : on les recalcule à chaque
-- avis créé / modifié / supprimé (SECURITY DEFINER pour contourner le RLS).
create or replace function public.refresh_vendor_rating()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  -- Autorise le trigger de protection (security.sql) à laisser passer ce
  -- recalcul automatique de rating/reviews.
  perform set_config('misstice.rating_sync', 'on', true);
  update public.vendors
    set rating = coalesce(
          (select round(avg(rating)::numeric, 1) from public.reviews where vendor_id = v),
          0
        ),
        reviews = (select count(*) from public.reviews where vendor_id = v)
    where id = v;
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_vendor_rating();

-- Backfill : recale les prestataires qui ont déjà des avis.
update public.vendors v
  set rating = r.avg_rating,
      reviews = r.cnt
  from (
    select vendor_id,
           round(avg(rating)::numeric, 1) as avg_rating,
           count(*) as cnt
    from public.reviews
    group by vendor_id
  ) r
  where r.vendor_id = v.id;

-- Fin.
