import BudgetClient from "@/components/dashboard/BudgetClient";
import EmptyState from "@/components/dashboard/EmptyState";
import { getCurrentEvent, getBudgetCategories } from "@/lib/queries";

export default async function BudgetPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return <EmptyState message="Créez un événement pour gérer son budget." />;
  }

  const cats = await getBudgetCategories(event.id);

  return (
    <BudgetClient
      eventId={event.id}
      eventName={event.name}
      budgetTotal={Number(event.budget_total)}
      categories={cats.map((c) => ({
        id: c.id,
        name: c.name,
        budget: Number(c.budget),
        spent: Number(c.spent),
        color: c.color,
      }))}
    />
  );
}
