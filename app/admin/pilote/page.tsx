import { createClient } from "@/lib/supabase/server";
import PiloteClient, { type PilotMemberRow, type FoundingMemberRow } from "@/components/admin/PiloteClient";

export default async function AdminPilotePage() {
  const supabase = createClient();

  const [{ data: settingsRow }, { data: pilotRows }, { data: foundingRows }] =
    await Promise.all([
      supabase
        .from("platform_settings")
        .select("pilot_quota, pilot_duration_months, free_tier_photo_limit")
        .eq("id", true)
        .maybeSingle(),
      supabase
        .from("vendor_profiles")
        .select("id, company, pilot_pack_pro_until, founding_member")
        .eq("pilot_member", true)
        .order("pilot_pack_pro_until", { ascending: true }),
      supabase
        .from("vendor_profiles")
        .select("id, company")
        .eq("founding_member", true)
        .order("company", { ascending: true }),
    ]);

  const settings = settingsRow as {
    pilot_quota: number;
    pilot_duration_months: number;
    free_tier_photo_limit: number;
  } | null;

  const pilotMembers = (pilotRows as PilotMemberRow[]) ?? [];
  const foundingMembers = (foundingRows as FoundingMemberRow[]) ?? [];

  return (
    <PiloteClient
      settings={{
        pilotQuota: settings?.pilot_quota ?? 5,
        pilotDurationMonths: settings?.pilot_duration_months ?? 6,
        freeTierPhotoLimit: settings?.free_tier_photo_limit ?? 3,
      }}
      pilotMembers={pilotMembers}
      foundingMembers={foundingMembers}
    />
  );
}
