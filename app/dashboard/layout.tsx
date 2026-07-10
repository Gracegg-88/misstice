import { redirect } from "next/navigation";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import Sidebar from "@/components/dashboard/Sidebar";
import { getProfile, getUserEvents, getCurrentEvent } from "@/lib/queries";
import { getUnreadTotal } from "@/lib/messaging";
import { getTeamUnreadTotal } from "@/lib/team-chat";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/auth?next=/dashboard");

  const [events, current, unread, teamUnread] = await Promise.all([
    getUserEvents(),
    getCurrentEvent(),
    getUnreadTotal(),
    getTeamUnreadTotal(),
  ]);

  return (
    <div className="flex h-screen flex-col bg-cream">
      <DashboardTopbar
        name={profile.full_name ?? undefined}
        role={profile.role}
        image={profile.avatar_url}
        events={events}
        currentEventId={current?.id ?? null}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar unread={unread + teamUnread} />
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
