import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lien court misstice.com/p/[slug] → redirection 308 vers l'URL canonique
 * /prestataires/[id], en reportant (ou en posant) le paramètre ?src= pour le
 * suivi des sources. L'URL canonique reste la seule indexée (voir
 * generateMetadata dans app/prestataires/[id]/page.tsx) : ce lien court n'est
 * qu'un raccourci à partager, jamais une page distincte.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendor_profiles")
    .select("id")
    .eq("slug", params.slug)
    .maybeSingle();
  const profile = data as { id: string } | null;
  if (!profile) {
    return NextResponse.redirect(new URL("/prestataires", request.url), 308);
  }

  const { data: vendorRow } = await supabase
    .from("vendors")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();
  const vendor = vendorRow as { id: string } | null;
  if (!vendor) {
    return NextResponse.redirect(new URL("/prestataires", request.url), 308);
  }

  const src = request.nextUrl.searchParams.get("src") || "lien";
  const target = new URL(`/prestataires/${vendor.id}`, request.url);
  target.searchParams.set("src", src);
  return NextResponse.redirect(target, 308);
}
