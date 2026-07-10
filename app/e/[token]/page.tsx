import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublicInvitationClient from "@/components/PublicInvitationClient";

type Invitation = {
  event_id: string;
  name: string;
  event_date: string | null;
  event_type: string | null;
  host_name: string | null;
  invitation_card_url: string | null;
};

export default async function PublicInvitationPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.rpc("public_event_invitation", {
    p_token: params.token,
  });
  const inv = ((data as Invitation[]) ?? [])[0];
  if (!inv) notFound();

  return <PublicInvitationClient token={params.token} invitation={inv} />;
}
