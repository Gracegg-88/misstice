-- ============================================================================
--  Misstice — PR1 : programme pilote, membres fondateurs, thème de fiche
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  Nécessite public.is_admin() (voir supabase/admin.sql).
-- ============================================================================

-- 1. RÉGLAGES DE LA PLATEFORME (une seule ligne, modifiable par l'admin)
--    - pilot_quota            : nombre de nouvelles inscriptions qui
--      bénéficient du Pack Pro gratuit pendant la phase pilote.
--    - pilot_duration_months  : durée du Pack Pro gratuit pour un pilote.
--    - free_tier_photo_limit  : nombre de photos max en formule gratuite
--      (sauf membre fondateur, ou pilote dont le Pack Pro est encore actif).
create table if not exists public.platform_settings (
  id                     boolean primary key default true check (id),
  pilot_quota            integer not null default 5 check (pilot_quota >= 0),
  pilot_duration_months  integer not null default 6 check (pilot_duration_months > 0),
  free_tier_photo_limit  integer not null default 3 check (free_tier_photo_limit > 0),
  updated_at             timestamptz not null default now()
);

insert into public.platform_settings (id) values (true)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

-- Lecture publique (le bandeau "places restantes" sur /devenir-prestataire
-- et la limite de photos affichée côté fiche prestataire en ont besoin).
drop policy if exists "platform_settings_public_read" on public.platform_settings;
create policy "platform_settings_public_read" on public.platform_settings
  for select using (true);

drop policy if exists "platform_settings_admin_write" on public.platform_settings;
create policy "platform_settings_admin_write" on public.platform_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- 2. STATUT PILOTE / FONDATEUR / THÈME — sur la fiche du prestataire
alter table public.vendor_profiles
  add column if not exists pilot_member boolean not null default false,
  add column if not exists pilot_pack_pro_until date,
  add column if not exists founding_member boolean not null default false,
  add column if not exists theme_id text not null default 'signature';

-- Un prestataire ne peut choisir qu'un thème gratuit (liste figée, voir
-- lib/themes.ts) : les thèmes "Pro" sont verrouillés même en écriture
-- directe, pas seulement dans l'interface. À élargir ici si la liste des
-- thèmes gratuits change.
alter table public.vendor_profiles drop constraint if exists vendor_profiles_theme_id_check;
alter table public.vendor_profiles
  add constraint vendor_profiles_theme_id_check
  check (theme_id in ('signature', 'nuit', 'ivoire-or', 'emeraude', 'terracotta', 'noir-elegant'));

-- 3. BACKFILL — tous les comptes prestataires déjà créés avant cette PR
--    deviennent membres fondateurs (photos illimitées pour toujours) ET
--    membres pilote (Pack Pro gratuit pendant pilot_duration_months à partir
--    d'aujourd'hui). Ne s'applique qu'une fois : les lignes déjà marquées
--    fondateur ne sont pas touchées au prochain lancement de ce fichier.
update public.vendor_profiles vp
set
  founding_member = true,
  pilot_member = true,
  pilot_pack_pro_until = (current_date + (make_interval(months => s.pilot_duration_months)))::date
from public.platform_settings s
where vp.founding_member = false;

-- 4. ATTRIBUTION AUTOMATIQUE D'UNE PLACE PILOTE À L'INSCRIPTION
--    Tant que des places restent (compte réel des membres pilote actuels,
--    jamais un compteur séparé qui pourrait dériver), la nouvelle fiche
--    reçoit automatiquement le Pack Pro gratuit. Atomique (SECURITY DEFINER +
--    trigger BEFORE INSERT) : pas de risque de double-attribution en cas
--    d'inscriptions simultanées.
create or replace function public.assign_pilot_slot()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  s record;
  taken integer;
begin
  select * into s from public.platform_settings where id = true;
  select count(*) into taken from public.vendor_profiles where pilot_member = true;
  if taken < s.pilot_quota then
    new.pilot_member := true;
    new.pilot_pack_pro_until := (current_date + make_interval(months => s.pilot_duration_months))::date;
  end if;
  return new;
end;
$$;

drop trigger if exists assign_pilot_slot_trigger on public.vendor_profiles;
create trigger assign_pilot_slot_trigger
  before insert on public.vendor_profiles
  for each row execute function public.assign_pilot_slot();

-- 5. PLACES PILOTE RESTANTES — fonction publique (pour le bandeau
--    /devenir-prestataire), ne révèle qu'un nombre, jamais la liste des
--    membres.
create or replace function public.pilot_slots_remaining()
returns integer
language sql
security definer set search_path = public
stable
as $$
  select greatest(
    0,
    (select pilot_quota from public.platform_settings where id = true)
    - (select count(*)::int from public.vendor_profiles where pilot_member = true)
  );
$$;
grant execute on function public.pilot_slots_remaining() to anon, authenticated;

-- 6. LIMITE DE PHOTOS CÔTÉ BASE — garde-fou en plus du blocage dans
--    l'interface (même logique que vendor-contact-guard.sql pour les
--    coordonnées) : un appel direct à l'API ne peut pas contourner la
--    limite. Jamais appliqué aux membres fondateurs, ni aux membres pilote
--    dont le Pack Pro gratuit est encore actif.
create or replace function public.enforce_photo_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  vp record;
  limit_n integer;
  current_n integer;
begin
  select founding_member, pilot_member, pilot_pack_pro_until
    into vp
    from public.vendor_profiles
    where id = new.vendor_id;

  if vp.founding_member then
    return new;
  end if;
  if vp.pilot_member and vp.pilot_pack_pro_until is not null and vp.pilot_pack_pro_until >= current_date then
    return new;
  end if;

  select free_tier_photo_limit into limit_n from public.platform_settings where id = true;
  select count(*) into current_n from public.vendor_photos where vendor_id = new.vendor_id;

  if current_n >= limit_n then
    raise exception 'Limite de % photos atteinte pour la formule gratuite.', limit_n;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_photo_limit_trigger on public.vendor_photos;
create trigger enforce_photo_limit_trigger
  before insert on public.vendor_photos
  for each row execute function public.enforce_photo_limit();

-- Fin.
