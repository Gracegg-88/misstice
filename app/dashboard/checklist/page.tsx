import ChecklistClient from "@/components/dashboard/ChecklistClient";
import EmptyState from "@/components/dashboard/EmptyState";
import { getCurrentEvent, getProfile } from "@/lib/queries";
import { getChecklist, getTeam } from "@/lib/dashboard";
import { getEventAccess, canEditSection } from "@/lib/permissions-server";
import { createClient } from "@/lib/supabase/server";

export default async function ChecklistPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return <EmptyState message="Créez un événement pour gérer votre checklist." />;
  }

  const [tasks, team, profile, access] = await Promise.all([
    getChecklist(event.id),
    getTeam(event.id),
    getProfile(),
    getEventAccess(event.id),
  ]);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Personnes assignables : l'organisateur (moi) + les membres de l'équipe.
  const assignees = [
    ...(user?.email
      ? [
          {
            email: user.email,
            label: `${profile?.full_name?.trim() || "Moi"} (organisateur)`,
            self: true,
          },
        ]
      : []),
    ...team
      .filter((m) => !!m.email)
      .map((m) => ({
        email: m.email,
        label: m.role?.trim() ? `${m.role} · ${m.email}` : m.email,
        self: false,
      })),
  ];

  return (
    <ChecklistClient
      key={event.id}
      eventId={event.id}
      eventName={event.name}
      initial={tasks}
      assignees={assignees}
      assignerName={profile?.full_name?.trim() || "L'organisateur"}
      canEdit={canEditSection(access, "checklist")}
    />
  );
}
