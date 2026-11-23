import type { SupabaseClient } from "@supabase/supabase-js";

// Copié depuis lib/geo.ts (jamais importé d'ici : ce fichier doit rester
// utilisable depuis un composant client, et lib/geo.ts importe lib/vendors.ts
// → lib/supabase/server, incompatible avec le navigateur).
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Attribue un slug unique à une fiche (misstice.com/p/[slug]) la première
 * fois qu'elle est créée. Jamais régénéré ensuite — un lien déjà partagé
 * reste valide même si le prestataire renomme son activité.
 */
export async function ensureVendorSlug(
  supabase: SupabaseClient,
  vendorProfileId: string,
  company: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("vendor_profiles")
    .select("slug")
    .eq("id", vendorProfileId)
    .maybeSingle();
  const current = (existing as { slug: string | null } | null)?.slug;
  if (current) return current;

  const base = slugify(company) || "prestataire";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate =
      attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("vendor_profiles")
      .update({ slug: candidate })
      .eq("id", vendorProfileId)
      .is("slug", null)
      .select("slug")
      .maybeSingle();
    if (error) {
      // 23505 = violation de contrainte unique (slug déjà pris) → on retente.
      if (error.code !== "23505") throw error;
      continue;
    }
    if (data) return (data as { slug: string }).slug;
    // Rien mis à jour (le filtre is("slug", null) n'a rien trouvé) : un autre
    // appel a déjà posé un slug entre-temps — on le relit.
    const { data: recheck } = await supabase
      .from("vendor_profiles")
      .select("slug")
      .eq("id", vendorProfileId)
      .maybeSingle();
    const recheckSlug = (recheck as { slug: string | null } | null)?.slug;
    if (recheckSlug) return recheckSlug;
  }
  throw new Error("Impossible d'attribuer un lien court après plusieurs tentatives.");
}
