-- ============================================================================
--  Misstice — Retrait progressif des fiches DÉMO de l'annuaire.
--  À exécuter dans Supabase → SQL Editor → Run. Idempotent.
--
--  À CHAQUE création d'une fiche prestataire RÉELLE (user_id renseigné), on
--  supprime UNE fiche démo (user_id null). Au fil des inscriptions, l'annuaire
--  ne contient plus que de vrais comptes.
--
--  ⚠️ Destructif : les fiches démo supprimées ne reviennent pas. Tant qu'il
--  reste peu de vrais comptes, l'annuaire peut paraître clairsemé.
-- ============================================================================

set check_function_bodies = off;

create or replace function public.retire_one_demo_vendor()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- Seulement quand une fiche RÉELLE vient d'être créée.
  if new.user_id is not null then
    delete from public.vendors
    where id = (
      select id from public.vendors
      where user_id is null
      order by position asc
      limit 1
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_real_vendor_created on public.vendors;
create trigger on_real_vendor_created
  after insert on public.vendors
  for each row execute function public.retire_one_demo_vendor();

-- Fin.
