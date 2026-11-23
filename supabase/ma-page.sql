-- ============================================================================
--  Misstice — PR1.5c : photos d'illustration par catégorie, onglet "Ma page"
--  (apparence, boutons), couverture courbe/dégradé réservée au Pack Pro.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
-- ============================================================================

-- 1. PHOTOS D'ILLUSTRATION PAR CATÉGORIE — téléversées par l'admin
--    uniquement (écran /admin/photos-illustration). Tant qu'une catégorie
--    n'a aucune photo, la fiche garde son affichage actuel (pas de changement
--    de comportement pour les catégories non renseignées).
create table if not exists public.category_illustration_photos (
  id         uuid primary key default gen_random_uuid(),
  category   text not null,
  url        text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists category_illustration_photos_category_idx
  on public.category_illustration_photos (category);

alter table public.category_illustration_photos enable row level security;

drop policy if exists "category_illustration_photos_read" on public.category_illustration_photos;
create policy "category_illustration_photos_read" on public.category_illustration_photos
  for select using (true);

drop policy if exists "category_illustration_photos_admin_write" on public.category_illustration_photos;
create policy "category_illustration_photos_admin_write" on public.category_illustration_photos
  for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('category-photos', 'category-photos', true)
on conflict (id) do nothing;

drop policy if exists "category_photos_read" on storage.objects;
create policy "category_photos_read" on storage.objects
  for select using (bucket_id = 'category-photos');

drop policy if exists "category_photos_admin_write" on storage.objects;
create policy "category_photos_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'category-photos' and public.is_admin())
  with check (bucket_id = 'category-photos' and public.is_admin());

-- 2. "MA PAGE" — Apparence (couverture, boutons)
alter table public.vendor_profiles
  add column if not exists cover_is_illustration boolean not null default false,
  -- Photo choisie dans category_illustration_photos (ignorée si
  -- cover_is_illustration = false). Tant que le prestataire a sa propre
  -- photo (vendors.image), celle-ci reste utilisée comme couverture par
  -- défaut : la photo d'illustration est une option, pas un remplacement
  -- automatique.
  add column if not exists cover_illustration_url text,
  add column if not exists cover_shape text not null default 'droite',
  add column if not exists cover_gradient text not null default 'aucun',
  add column if not exists button_config jsonb not null default
    '["devis","message","disponibilites","composer"]'::jsonb;

-- Forme et dégradé de couverture : liste blanche (droite = gratuit, le reste
-- réservé au Pack Pro — voir lib/themes.ts côté application pour le détail
-- des droits). Toujours validé ici aussi, pas seulement côté serveur Next.
alter table public.vendor_profiles drop constraint if exists vendor_profiles_cover_shape_check;
alter table public.vendor_profiles
  add constraint vendor_profiles_cover_shape_check
  check (cover_shape in ('droite', 'courbe', 'vague', 'arche'));

alter table public.vendor_profiles drop constraint if exists vendor_profiles_cover_gradient_check;
alter table public.vendor_profiles
  add constraint vendor_profiles_cover_gradient_check
  check (cover_gradient in ('aucun', 'leger', 'moyen', 'fort'));

-- Garde-fou côté base (même logique que enforce_photo_limit) : même si
-- l'interface Pro bloque déjà l'enregistrement d'une forme/dégradé payant
-- (fenêtre Pack Pro, voir components/pro/PackProModal.tsx), un appel direct
-- à l'API ne doit pas pouvoir contourner la règle. Même définition d'accès
-- que lib/pilot-utils.ts#hasPackProAccess (pilote actif seulement — un
-- membre fondateur n'a pas accès au Pack Pro par ce seul statut).
create or replace function public.enforce_cover_pro_gate()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  has_access boolean;
begin
  has_access := new.pilot_member
    and new.pilot_pack_pro_until is not null
    and new.pilot_pack_pro_until >= current_date;
  if not has_access then
    new.cover_shape := 'droite';
    new.cover_gradient := 'aucun';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_cover_pro_gate_trigger on public.vendor_profiles;
create trigger enforce_cover_pro_gate_trigger
  before insert or update on public.vendor_profiles
  for each row execute function public.enforce_cover_pro_gate();

-- 3. INTÉRÊT POUR LE PACK PRO — horodatage du clic "Passer au Pack Pro"
--    dans la fenêtre d'incitation (pas encore un abonnement : la facturation
--    arrive en PR2a). Permet à l'admin de recontacter les prestataires
--    intéressés avant le lancement de l'abonnement.
alter table public.vendor_profiles
  add column if not exists pack_pro_interest_at timestamptz;

-- Fin.
