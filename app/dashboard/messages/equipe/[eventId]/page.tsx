import { redirect } from "next/navigation";
import TeamThread from "@/components/messaging/TeamThread";
import { getTeamThread } from "@/lib/team-chat";

export default async function TeamThreadPage({
  params,
}: {
  params: { eventId: string };
}) {
  const res = await getTeamThread(params.eventId);
  if (!res) redirect("/dashboard/messages");

  return (
    <TeamThread
      eventId={params.eventId}
      eventName={res.eventName}
      userId={res.userId}
      initial={res.initial}
      basePath="/dashboard/messages"
    />
  );
}
