import CalendrierClient, {
  type QuoteEvent,
} from "@/components/pro/CalendrierClient";
import { getMyAvailability, getMyQuotes } from "@/lib/pro";

export default async function ProCalendrierPage() {
  const [initial, quotes] = await Promise.all([
    getMyAvailability(),
    getMyQuotes(),
  ]);

  // Version légère des devis datés (yyyy-mm-dd) pour relier chaque jour.
  const events: QuoteEvent[] = quotes
    .filter((q) => q.event_date && /^\d{4}-\d{2}-\d{2}$/.test(q.event_date))
    .map((q) => ({
      id: q.id,
      date: q.event_date as string,
      title: q.event_need || q.event_label || "Événement",
      location: q.event_location,
      status: q.status,
    }));

  return <CalendrierClient initial={initial} events={events} />;
}
