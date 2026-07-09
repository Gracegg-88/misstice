import BudgetClient from "@/components/dashboard/BudgetClient";
import EmptyState from "@/components/dashboard/EmptyState";
import { getCurrentEvent, getBudgetCategories } from "@/lib/queries";
import { getEventAccess, canEditSection } from "@/lib/permissions-server";

export default async function BudgetPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return <EmptyState message="Créez un événement pour gérer son budget." />;
  }

  const [cats, access] = await Promise.all([
    getBudgetCategories(event.id),
    getEventAccess(event.id),
  ]);
  const canEdit = canEditSection(access, "budget");

  return (
    <BudgetClient
      eventId={event.id}
      eventName={event.name}
      canEdit={canEdit}
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
