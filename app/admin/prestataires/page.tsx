import { createClient } from "@/lib/supabase/server";
import PrestatairesClient from "@/components/admin/PrestatairesClient";
import { containsContactInfo } from "@/lib/contact-detection";

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
  /** Champs publics de la fiche où des coordonnées ont été détectées. */
  contactFields: string[];
  googlePlaceId: string | null;
  googlePlaceStatus: "a_valider" | "valide" | null;
};

export default async function AdminPrestataires() {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select(
      "id, name, category, city, verified, reviewed_at, user_id, claim_status, contact_email, vues_fiche, tentatives_contact, last_relance_sent_at, tagline, price_from"
    )
    .order("position", { ascending: true });

  // Lien Google (supabase/google-places.sql) : requête séparée et tolérante,
  // pour que la page reste fonctionnelle tant que le script n'est pas exécuté.
  const { data: googleData, error: googleErr } = await supabase
    .from("vendors")
    .select("id, google_place_id, google_place_status");
  const googleById = new Map(
    googleErr
      ? []
      : (
          (googleData as
            | { id: string; google_place_id: string | null; google_place_status: "a_valider" | "valide" | null }[]
            | null) ?? []
        ).map((g) => [g.id, g])
  );

  const rows = (
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
      tagline: string | null;
      price_from: string | null;
    }[]) ?? []
  );

  // Textes publics saisis par les prestataires inscrits (« À propos » et
  // formules), pour le filtre « Coordonnées détectées » — même détection que
  // le blocage du formulaire pro (lib/contact-detection.ts).
  const userIds = rows.map((r) => r.user_id).filter((id): id is string => !!id);
  const [{ data: profilesData }, { data: packagesData }] = userIds.length
    ? await Promise.all([
        supabase.from("vendor_profiles").select("id, company, city, about").in("id", userIds),
        supabase.from("vendor_packages").select("vendor_id, name, price, features").in("vendor_id", userIds),
      ])
    : [{ data: [] }, { data: [] }];
  const profiles = new Map(
    ((profilesData as { id: string; company: string | null; city: string | null; about: string | null }[] | null) ?? []).map(
      (p) => [p.id, p]
    )
  );
  const packagesByVendor = new Map<string, string[]>();
  for (const p of (packagesData as { vendor_id: string; name: string; price: string | null; features: string[] | null }[] | null) ?? []) {
    const list = packagesByVendor.get(p.vendor_id) ?? [];
    list.push(p.name, p.price ?? "", ...(p.features ?? []));
    packagesByVendor.set(p.vendor_id, list);
  }

  const vendors = rows.map(
    ({ user_id, claim_status, contact_email, vues_fiche, tentatives_contact, last_relance_sent_at, tagline, price_from, ...v }) => {
      const profile = user_id ? profiles.get(user_id) : undefined;
      const fields: [string, (string | null | undefined)[]][] = [
        ["Nom", [v.name, profile?.company]],
        ["Ville", [v.city, profile?.city]],
        ["Accroche", [tagline]],
        ["À propos", [profile?.about]],
        ["Prix", [price_from]],
        ["Formules", user_id ? packagesByVendor.get(user_id) ?? [] : []],
      ];
      return {
        ...v,
        isDemo: user_id === null,
        claimStatus: claim_status,
        contactEmail: contact_email,
        vuesFiche: vues_fiche,
        tentativesContact: tentatives_contact,
        lastRelanceSentAt: last_relance_sent_at,
        contactFields: fields.filter(([, texts]) => texts.some((t) => containsContactInfo(t))).map(([label]) => label),
        googlePlaceId: googleById.get(v.id)?.google_place_id ?? null,
        googlePlaceStatus: googleById.get(v.id)?.google_place_status ?? null,
      };
    }
  );

  // Fiches vitrines d'abord (à nettoyer en priorité), puis pas encore relues.
  vendors.sort((a, b) => {
    if (a.isDemo !== b.isDemo) return a.isDemo ? -1 : 1;
    if (!a.reviewed_at && b.reviewed_at) return -1;
    if (a.reviewed_at && !b.reviewed_at) return 1;
    return 0;
  });

  return <PrestatairesClient vendors={vendors} />;
}
