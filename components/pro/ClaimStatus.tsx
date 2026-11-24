import { createClient } from "@/lib/supabase/server";
import { ClipboardCheck } from "lucide-react";
import ClaimConfirmButton from "@/components/pro/ClaimConfirmButton";

type ClaimRow = {
  id: string;
  imported_vendor_id: string;
  status: "en_attente" | "validee" | "refusee";
  motif_refus: string | null;
  created_at: string;
  decided_at: string | null;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Statut des demandes de rattachement d'une fiche importée (« Réclamer ma
 * fiche »), en haut de l'espace pro. Avec ?reclamer=<id> (prestataire déjà
 * inscrit qui clique sur « Réclamer ma fiche »), propose d'envoyer la demande.
 */
export default async function ClaimStatus({ reclamerId }: { reclamerId?: string | null }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("vendor_claim_requests")
    .select("id, imported_vendor_id, status, motif_refus, created_at, decided_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return null; // table pas encore créée : rien à afficher
  const rows = (data as ClaimRow[]) ?? [];

  const validId = reclamerId && /^[0-9a-f-]{36}$/i.test(reclamerId) ? reclamerId : null;
  const ids = Array.from(new Set([...rows.map((r) => r.imported_vendor_id), ...(validId ? [validId] : [])]));
  const { data: vendorRows } = ids.length
    ? await supabase.from("vendors").select("id, name, city, claim_status, user_id").in("id", ids)
    : { data: [] };
  const vendors = new Map(
    ((vendorRows as { id: string; name: string; city: string | null; claim_status: string | null; user_id: string | null }[]) ?? []).map(
      (v) => [v.id, v]
    )
  );

  // Demandes à afficher : en attente, ou décidées depuis moins de 30 jours.
  const visible = rows.filter(
    (r) => r.status === "en_attente" || (r.decided_at && Date.now() - new Date(r.decided_at).getTime() < 30 * DAY)
  );
  const target = validId ? vendors.get(validId) : undefined;
  const canRequest =
    !!target && target.claim_status === "non_reclamee" && !target.user_id && !rows.some((r) => r.imported_vendor_id === validId && r.status === "en_attente");

  if (!visible.length && !canRequest) return null;

  return (
    <div className="mt-5 space-y-3">
      {canRequest && target && (
        <div className="rounded-3xl border border-violet/20 bg-violet-soft/50 p-5">
          <p className="font-display text-lg font-semibold text-plum">Réclamer la fiche « {target.name} »</p>
          <p className="mt-1 text-sm text-slate">
            Vous êtes le responsable de cette entreprise{target.city ? ` à ${target.city}` : ""} ? Envoyez une demande de
            rattachement : l&apos;équipe Misstice la vérifie, puis la fiche est fusionnée avec la vôtre.
          </p>
          <ClaimConfirmButton vendorId={target.id} userId={user.id} />
        </div>
      )}
      {visible.map((r) => {
        const name = vendors.get(r.imported_vendor_id)?.name ?? "la fiche";
        const tone =
          r.status === "validee"
            ? "border-emerald/20 bg-emerald-soft/60"
            : r.status === "refusee"
              ? "border-garnet/20 bg-garnet-soft/60"
              : "border-violet/20 bg-violet-soft/50";
        return (
          <div key={r.id} className={`rounded-3xl border p-5 ${tone}`}>
            <div className="flex items-center gap-2">
              <ClipboardCheck size={18} className="text-violet" />
              <p className="font-display text-lg font-semibold text-plum">
                {r.status === "en_attente" && <>Réclamation de « {name} » en cours de vérification</>}
                {r.status === "validee" && <>La fiche « {name} » est rattachée à votre compte</>}
                {r.status === "refusee" && <>Réclamation de « {name} » refusée</>}
              </p>
            </div>
            <p className="mt-2 text-sm text-slate">
              {r.status === "en_attente" &&
                "L'équipe Misstice vérifie que vous êtes bien le responsable de cette entreprise. Vous serez informé dès que la fiche sera rattachée à votre compte."}
              {r.status === "validee" &&
                "Son historique et son ancienneté sont conservés ; vos informations (accroche, tarifs, photo) y ont été reportées."}
              {r.status === "refusee" &&
                (r.motif_refus ? `Motif : ${r.motif_refus}` : "Contactez l'équipe Misstice pour en savoir plus.")}
            </p>
          </div>
        );
      })}
    </div>
  );
}
