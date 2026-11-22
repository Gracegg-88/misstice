-- ============================================================================
--  Misstice — PR1.5b : calendrier public (bouton "Voir mes disponibilités")
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  La table vendor_availability reste PRIVÉE (voir availability-public.sql,
--  correctif HIGH-6 : jamais de lecture publique directe, la colonne `note`
--  est confidentielle). Cette fonction expose UNIQUEMENT un booléen
--  "disponible / pas disponible" par jour, sur une fenêtre bornée (90 jours
--  max) — jamais le statut détaillé (booked/pending/blocked), jamais la note.
-- ============================================================================

create or replace function public.public_vendor_calendar(
  p_user uuid,
  p_from date,
  p_to date
)
returns table (cal_date date, is_available boolean)
language sql
security definer set search_path = public
stable
as $$
  select
    d::date as cal_date,
    not exists (
      select 1 from public.vendor_availability va
      where va.prestataire_id = p_user
        and va.date = d::date
        and va.status in ('booked', 'pending', 'blocked')
    ) as is_available
  from generate_series(
    greatest(p_from, current_date),
    least(p_to, current_date + 90),
    interval '1 day'
  ) as d
  where p_to >= p_from;
$$;

grant execute on function public.public_vendor_calendar(uuid, date, date) to anon, authenticated;

-- Fin.
