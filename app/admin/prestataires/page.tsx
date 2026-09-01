import { createClient } from "@/lib/supabase/server";
import PrestatairesClient from "@/components/admin/PrestatairesClient";

type Vendor = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  verified: boolean;
  reviewed_at: string | null;
  isDemo: boolean;
  claimStatus: "reclamee" | "non_reclamee";
  contactEmail: string | null;
  vuesFiche: number;
  tentativesContact: number;
  lastRelanceSentAt: string | null;
};

export default async function AdminPrestataires() {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select(
      "id, name, category, city, verified, reviewed_at, user_id, claim_status, contact_email, vues_fiche, tentatives_contact, last_relance_sent_at"
    )
    .order("position", { ascending: true });

  const vendors = (
    (data as {
      id: string;
      name: string;
      category: string | null;
      city: string | null;
      verified: boolean;
      reviewed_at: string | null;
      user_id: string | null;
      claim_status: "reclamee" | "non_reclamee";
      contact_email: string | null;
      vues_fiche: number;
      tentatives_contact: number;
      last_relance_sent_at: string | null;
    }[]) ?? []
  ).map(({ user_id, claim_status, contact_email, vues_fiche, tentatives_contact, last_relance_sent_at, ...v }) => ({
    ...v,
    isDemo: user_id === null,
    claimStatus: claim_status,
    contactEmail: contact_email,
    vuesFiche: vues_fiche,
    tentativesContact: tentatives_contact,
    lastRelanceSentAt: last_relance_sent_at,
  }));

  // Fiches vitrines d'abord (à nettoyer en priorité), puis pas encore relues.
  vendors.sort((a, b) => {
    if (a.isDemo !== b.isDemo) return a.isDemo ? -1 : 1;
    if (!a.reviewed_at && b.reviewed_at) return -1;
    if (a.reviewed_at && !b.reviewed_at) return 1;
    return 0;
  });

  return <PrestatairesClient vendors={vendors} />;
}
