import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export {
  isPilotPackProActive,
  canUploadMorePhotos,
  type PilotStatus,
} from "./pilot-utils";

export type PlatformSettings = {
  pilotQuota: number;
  pilotDurationMonths: number;
  freeTierPhotoLimit: number;
};

/** Réglages de la plateforme (une seule ligne, modifiable depuis l'admin). */
export async function getPlatformSettings(
  client?: SupabaseClient
): Promise<PlatformSettings> {
  const supabase = client ?? createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("pilot_quota, pilot_duration_months, free_tier_photo_limit")
    .eq("id", true)
    .maybeSingle();
  const row = data as {
    pilot_quota: number;
    pilot_duration_months: number;
    free_tier_photo_limit: number;
  } | null;
  return {
    pilotQuota: row?.pilot_quota ?? 5,
    pilotDurationMonths: row?.pilot_duration_months ?? 6,
    freeTierPhotoLimit: row?.free_tier_photo_limit ?? 3,
  };
}

/** Nombre de places pilote (Pack Pro gratuit) encore disponibles. Jamais un
 *  compteur séparé : toujours recalculé depuis les membres pilote réels. */
export async function getPilotSlotsRemaining(
  client?: SupabaseClient
): Promise<number> {
  const supabase = client ?? createClient();
  const { data } = await supabase.rpc("pilot_slots_remaining");
  return Number(data ?? 0);
}
