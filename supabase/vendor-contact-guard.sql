-- ─────────────────────────────────────────────────────────────────────────
-- Coordonnées interdites sur la fiche publique d'un prestataire
-- (téléphone, email, site web, pseudo @, WhatsApp/Instagram…, IBAN).
--
-- Le formulaire pro (components/pro/ProfilClient.tsx) bloque déjà
-- l'enregistrement ; ces triggers font la même vérification côté base pour
-- que le blocage ne soit pas contournable depuis le navigateur.
--
-- - Seuls les champs MODIFIÉS sont vérifiés : une fiche existante qui
--   contient déjà des coordonnées n'est pas bloquée tant que ces champs ne
--   changent pas (aucune donnée existante n'est modifiée par ce script ; la
--   liste des fiches concernées est dans /admin/prestataires, filtre
--   « Coordonnées détectées »).
-- - Les admins passent outre (public.is_admin()), ainsi que les écritures
--   système sans utilisateur connecté (service_role des crons/webhooks,
--   trigger d'inscription handle_new_user, éditeur SQL).
--
-- Idempotent : peut être relancé sans effet de bord.
--
-- ⚠️ Même détection que lib/contact-detection.ts (containsContactInfo) :
-- toute modification d'un côté doit être reportée de l'autre.
-- Rappel syntaxe PostgreSQL : \y = limite de mot (équivalent de \b en JS).
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.contains_contact_info(t text)
returns boolean
language sql
immutable
as $$
  select coalesce(t, '') <> '' and (
    -- Email, y compris « jean (at) gmail point com »
    t ~* '[a-z0-9._%+-]+\s*(@|\(at\)|\[at\]|\sarobase\s)\s*[a-z0-9-]+(\s*(\.|\(dot\)|\[dot\]|\spoint\s)\s*[a-z0-9-]+)*\s*(\.|\(dot\)|\[dot\]|\spoint\s)\s*[a-z]{2,}'
    -- Téléphone français : 06 12 34 56 78, +33 6 12 34 56 78…
    or t ~ '((\+|00)\s*33\s*\(?0?\)?\s*|\y0)[1-9]([\s.-]*\d{2}){4}\y'
    -- Autre numéro international
    or t ~ '\+\s*\d{1,3}([\s.-]*\d){8,}'
    -- IBAN
    or t ~ '\y[A-Z]{2}\d{2}(\s?[A-Z0-9]{4}){3,7}\y'
    -- Messageries / réseaux / paiements externes
    or t ~* '\y(whats\s?app|telegram|snap(chat)?|insta(gram)?|paypal|lydia|iban|rib)\y'
    -- Adresse de site : http(s):// ou www.
    or t ~* '\yhttps?://|\ywww\.'
    -- Nom de domaine : monsite.fr, mon-studio.com…
    or t ~* '\y[a-z0-9-]+\.(fr|com|net|org|eu|be|ch|io|info|biz|shop|store|site|online)\y'
    -- Pseudo de réseau social : @mon.studio
    or t ~* '(^|[\s(])@[a-z0-9_.]{2,}'
  );
$$;

-- Message renvoyé au navigateur (affiché tel quel dans le formulaire pro).
create or replace function public.raise_contact_info_forbidden()
returns void
language plpgsql
as $$
begin
  raise exception using
    errcode = 'check_violation',
    message = 'Pour protéger vos clients et vous, les coordonnées ne peuvent pas apparaître sur votre fiche : elles sont transmises au client dès qu''il accepte votre devis.';
end;
$$;

-- true si l'écriture doit échapper au contrôle (admin ou écriture système).
create or replace function public.contact_guard_bypass()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select auth.uid() is null or public.is_admin();
$$;

-- vendor_profiles : company, city, about
create or replace function public.guard_vendor_profile_contact()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.contact_guard_bypass() then
    return new;
  end if;
  if (tg_op = 'INSERT' or new.company is distinct from old.company) and public.contains_contact_info(new.company)
     or (tg_op = 'INSERT' or new.city is distinct from old.city) and public.contains_contact_info(new.city)
     or (tg_op = 'INSERT' or new.about is distinct from old.about) and public.contains_contact_info(new.about)
  then
    perform public.raise_contact_info_forbidden();
  end if;
  return new;
end;
$$;

drop trigger if exists vendor_profiles_contact_guard on public.vendor_profiles;
create trigger vendor_profiles_contact_guard
  before insert or update on public.vendor_profiles
  for each row execute function public.guard_vendor_profile_contact();

-- vendors (fiche annuaire) : name, city, tagline, price_from
create or replace function public.guard_vendor_contact()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.contact_guard_bypass() then
    return new;
  end if;
  if (tg_op = 'INSERT' or new.name is distinct from old.name) and public.contains_contact_info(new.name)
     or (tg_op = 'INSERT' or new.city is distinct from old.city) and public.contains_contact_info(new.city)
     or (tg_op = 'INSERT' or new.tagline is distinct from old.tagline) and public.contains_contact_info(new.tagline)
     or (tg_op = 'INSERT' or new.price_from is distinct from old.price_from) and public.contains_contact_info(new.price_from)
  then
    perform public.raise_contact_info_forbidden();
  end if;
  return new;
end;
$$;

drop trigger if exists vendors_contact_guard on public.vendors;
create trigger vendors_contact_guard
  before insert or update on public.vendors
  for each row execute function public.guard_vendor_contact();

-- vendor_packages (formules) : name, price, features
create or replace function public.guard_vendor_package_contact()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.contact_guard_bypass() then
    return new;
  end if;
  if (tg_op = 'INSERT' or new.name is distinct from old.name) and public.contains_contact_info(new.name)
     or (tg_op = 'INSERT' or new.price is distinct from old.price) and public.contains_contact_info(new.price)
     or (tg_op = 'INSERT' or new.features is distinct from old.features)
        and public.contains_contact_info(array_to_string(new.features, ' '))
  then
    perform public.raise_contact_info_forbidden();
  end if;
  return new;
end;
$$;

drop trigger if exists vendor_packages_contact_guard on public.vendor_packages;
create trigger vendor_packages_contact_guard
  before insert or update on public.vendor_packages
  for each row execute function public.guard_vendor_package_contact();
