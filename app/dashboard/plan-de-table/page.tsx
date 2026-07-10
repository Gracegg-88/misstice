import SeatingClient from "@/components/dashboard/SeatingClient";
import EmptyState from "@/components/dashboard/EmptyState";
import { getCurrentEvent } from "@/lib/queries";
import { getSeatingTables, getSeatingSeats, getGuests } from "@/lib/dashboard";
import { getEventAccess, canEditSection } from "@/lib/permissions-server";

export default async function PlanDeTablePage() {
  const event = await getCurrentEvent();

  if (!event) {
    return <EmptyState message="Créez un événement pour composer votre plan de table." />;
  }

  const [tables, seats, guests, access] = await Promise.all([
    getSeatingTables(event.id),
    getSeatingSeats(event.id),
    getGuests(event.id),
    getEventAccess(event.id),
  ]);

  const guestNames = Array.from(
    new Set(
      guests.map((g) => g.name?.trim()).filter((n): n is string => !!n)
    )
  ).sort();

  return (
    <SeatingClient
      key={event.id}
      eventId={event.id}
      eventName={event.name}
      initialTables={tables}
      initialSeats={seats}
      guestNames={guestNames}
      canEdit={canEditSection(access, "plan_table")}
    />
  );
}
