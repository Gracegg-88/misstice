-- ============================================================================
--  Misstice — Disponibilité prestataire : exposition publique MINIMALE.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--  (À lancer APRÈS pro.sql / security.sql.)
--
--  SÉCURITÉ (correctif HIGH-6) : la table vendor_availability contient le
--  planning (booked/pending/blocked) ET une colonne `note` PRIVÉE. On NE
--  l'expose PAS en lecture publique. La fiche publique n'a besoin que de la
--  PROCHAINE date disponible → fournie par une fonction SECURITY DEFINER qui
--  ne renvoie ni la note, ni le détail du calendrier.
-- ============================================================================

set check_function_bodies = off;

-- Lecture de la table réservée au prestataire propriétaire (pas d'accès anon).
drop policy if exists "availability_read" on public.vendor_availability;
create policy "availability_read" on public.vendor_availability
  for select using (prestataire_id = auth.uid());

-- Seule donnée publique : la prochaine date explicitement « disponible ».
create or replace function public.public_next_availability(p_user uuid)
returns date
language sql security definer set search_path = public stable
as $$
  select min(date)
  from public.vendor_availability
  where prestataire_id = p_user
    and status = 'available'
    and date >= current_date;
$$;
grant execute on function public.public_next_availability(uuid) to anon, authenticated;

-- Fin.
