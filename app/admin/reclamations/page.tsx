import { createClient } from "@/lib/supabase/server";
import ReclamationsClient, { type ClaimRequestRow } from "@/components/admin/ReclamationsClient";

export const dynamic = "force-dynamic";

/**
 * Demandes de rattachement d'une fiche importée (SIRENE) à un compte
 * prestataire. Le SIRET étant public, il ne prouve pas la propriété à lui
 * seul : la décision est humaine. Signal fort affiché : le prestataire a fait
 * vérifier le même SIRET dans son espace pro.
 */
export default async function AdminReclamationsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendor_claim_requests")
    .select("id, imported_vendor_id, user_id, status, motif_refus, created_at, decided_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows =
    (data as {
      id: string;
      imported_vendor_id: string;
      user_id: string;
      status: ClaimRequestRow["status"];
      motif_refus: string | null;
      created_at: string;
      decided_at: string | null;
    }[]) ?? [];

  const vendorIds = Array.from(new Set(rows.map((r) => r.imported_vendor_id)));
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

  const [{ data: imported }, { data: profiles }, { data: vendorProfiles }, { data: ownFiches }] = await Promise.all([
    vendorIds.length
      ? supabase.from("vendors").select("id, name, category, city, siret, claim_status").in("id", vendorIds)
      : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from("profiles").select("id, full_name").in("id", userIds) : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from("vendor_profiles").select("id, company, category, city, siret, siret_verified_at").in("id", userIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from("vendors").select("id, user_id, name").in("user_id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  type V = { id: string; name: string; category: string | null; city: string | null; siret: string | null; claim_status: string | null };
  type P = { id: string; full_name: string | null };
  type VP = { id: string; company: string | null; category: string | null; city: string | null; siret: string | null; siret_verified_at: string | null };
  type F = { id: string; user_id: string; name: string };
  const vById = new Map(((imported as V[]) ?? []).map((v) => [v.id, v]));
  const pById = new Map(((profiles as P[]) ?? []).map((p) => [p.id, p]));
  const vpById = new Map(((vendorProfiles as VP[]) ?? []).map((p) => [p.id, p]));
  const ficheByUser = new Map<string, F>();
  for (const f of (ownFiches as F[]) ?? []) if (!ficheByUser.has(f.user_id)) ficheByUser.set(f.user_id, f);

  const requests: ClaimRequestRow[] = rows.map((r) => {
    const v = vById.get(r.imported_vendor_id);
    const vp = vpById.get(r.user_id);
    const digits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");
    return {
      id: r.id,
      status: r.status,
      motifRefus: r.motif_refus,
      createdAt: r.created_at,
      decidedAt: r.decided_at,
      imported: {
        id: r.imported_vendor_id,
        name: v?.name ?? "Fiche supprimée",
        category: v?.category ?? null,
        city: v?.city ?? null,
        siret: v?.siret ?? null,
      },
      claimant: {
        name: pById.get(r.user_id)?.full_name?.trim() || "—",
        company: vp?.company ?? null,
        category: vp?.category ?? null,
        city: vp?.city ?? null,
        siret: vp?.siret ?? null,
        siretVerified: !!vp?.siret_verified_at,
        ficheId: ficheByUser.get(r.user_id)?.id ?? null,
      },
      siretMatch: !!v?.siret && !!vp?.siret && digits(v.siret) === digits(vp.siret) && !!vp.siret_verified_at,
    };
  });

  return <ReclamationsClient requests={requests} tableMissing={!!error} />;
}
