-- Validé et exécuté le 22/11/2026.
--
-- Date de dernière modification des fiches prestataires, utilisée comme
-- <lastmod> dans le sitemap (app/sitemap.ts). Tant que cette colonne
-- n'existe pas, le code se replie sur created_at.
--
-- Idempotent : peut être relancé sans effet de bord. Les fiches existantes
-- reçoivent leur date de création comme valeur de départ (on ne connaît pas
-- leur vraie date de dernière modification).

alter table public.vendors
  add column if not exists updated_at timestamptz;

update public.vendors set updated_at = created_at where updated_at is null;

alter table public.vendors
  alter column updated_at set default now(),
  alter column updated_at set not null;

create or replace function public.touch_vendor_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists vendors_touch_updated_at on public.vendors;
-- Uniquement quand une donnée VISIBLE sur la fiche change (pas les
-- compteurs de vues ou de contacts, qui changent sans cesse).
create trigger vendors_touch_updated_at
  before update of name, category, city, region, tagline, price_from, price_level,
    image, verified, claim_status, retire_le, rating, reviews, languages,
    moods, energies, lights, palettes, atmospheres, music_styles
  on public.vendors
  for each row execute function public.touch_vendor_updated_at();

-- La fiche publique dépend aussi de la description (vendor_profiles.about)
-- et des photos du book (vendor_photos) : quand l'une change, la fiche
-- annuaire liée (vendors.user_id) est datée à nouveau. C'est ce qui fait
-- passer automatiquement une fiche complétée dans le sitemap avec une date
-- à jour (règle d'indexation : lib/seo-rules.ts).
create or replace function public.touch_vendor_from_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  owner uuid := coalesce(new.id, old.id);
begin
  update public.vendors set updated_at = now() where user_id = owner;
  return coalesce(new, old);
end;
$$;

drop trigger if exists vendor_profiles_touch_vendor on public.vendor_profiles;
create trigger vendor_profiles_touch_vendor
  after update of about on public.vendor_profiles
  for each row
  when (old.about is distinct from new.about)
  execute function public.touch_vendor_from_profile();

create or replace function public.touch_vendor_from_photo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.vendors set updated_at = now()
    where user_id = coalesce(new.vendor_id, old.vendor_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists vendor_photos_touch_vendor on public.vendor_photos;
create trigger vendor_photos_touch_vendor
  after insert or delete on public.vendor_photos
  for each row execute function public.touch_vendor_from_photo();
