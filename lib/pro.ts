import { createClient } from "@/lib/supabase/server";
import type {
  ProVendor,
  Quote,
  QuoteItem,
  VendorPackage,
  VendorPhoto,
  Availability,
  ProStats,
} from "@/lib/pro-types";

export type {
  ProVendor,
  Quote,
  QuoteItem,
  VendorPackage,
  VendorPhoto,
  Availability,
  ProStats,
} from "@/lib/pro-types";

const QUOTE_COLS =
  "id, prestataire_id, conversation_id, client_name, event_label, amount, status, created_at, quote_number, validity_days, intro_message, event_need, event_date, event_location, guests_count, client_email, client_phone, client_address, service_fee, tax_rate, items, presta_name, presta_category, presta_email, presta_phone, presta_address";

/** Le prestataire connecté : profil détaillé + fiche annuaire liée. */
export async function getMyVendor(): Promise<ProVendor | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vp } = await supabase
    .from("vendor_profiles")
    .select("id, company, category, city, about")
    .eq("id", user.id)
    .maybeSingle();
  if (!vp) return null;

  const { data: v } = await supabase
    .from("vendors")
    .select(
      "id, tagline, price_from, image, verified, rating, reviews, moods, energies, lights, palettes, atmospheres, music_styles"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const vv = v as
    | {
        id: string;
        tagline: string | null;
        price_from: string | null;
        image: string | null;
        verified: boolean;
        rating: number;
        reviews: number;
        moods: string[] | null;
        energies: string[] | null;
        lights: string[] | null;
        palettes: string[] | null;
        atmospheres: string[] | null;
        music_styles: string[] | null;
      }
    | null;

  const p = vp as {
    id: string;
    company: string;
    category: string | null;
    city: string | null;
    about: string | null;
  };

  return {
    profileId: user.id,
    vendorId: vv?.id ?? null,
    company: p.company,
    category: p.category,
    city: p.city,
    about: p.about,
    tagline: vv?.tagline ?? null,
    priceFrom: vv?.price_from ?? null,
    image: vv?.image ?? null,
    verified: vv?.verified ?? false,
    rating: Number(vv?.rating ?? 0),
    reviews: vv?.reviews ?? 0,
    moods: vv?.moods ?? [],
    energies: vv?.energies ?? [],
    lights: vv?.lights ?? [],
    palettes: vv?.palettes ?? [],
    atmospheres: vv?.atmospheres ?? [],
    music: vv?.music_styles ?? [],
  };
}

// Normalise une ligne quotes (items en jsonb) vers le type Quote.
function normalizeQuote(row: Record<string, unknown>): Quote {
  const rawItems = row.items;
  const items: QuoteItem[] = Array.isArray(rawItems)
    ? (rawItems as QuoteItem[])
    : [];
  return {
    ...(row as unknown as Quote),
    items,
    amount: Number(row.amount ?? 0),
    service_fee: Number(row.service_fee ?? 0),
    tax_rate: Number(row.tax_rate ?? 0),
    validity_days: Number(row.validity_days ?? 15),
  };
}

export async function getMyQuotes(): Promise<Quote[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("quotes")
    .select(QUOTE_COLS)
    .eq("prestataire_id", user.id)
    .order("created_at", { ascending: false });
  return ((data as Record<string, unknown>[]) ?? []).map(normalizeQuote);
}

/** Un devis par id (visible par le prestataire ET la famille via le RLS). */
export async function getQuote(id: string): Promise<Quote | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("quotes")
    .select(QUOTE_COLS)
    .eq("id", id)
    .maybeSingle();
  return data ? normalizeQuote(data as Record<string, unknown>) : null;
}

export async function getMyPackages(): Promise<VendorPackage[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("vendor_packages")
    .select("id, vendor_id, name, price, features, popular, position")
    .eq("vendor_id", user.id)
    .order("position", { ascending: true });
  return (data as VendorPackage[]) ?? [];
}

export async function getMyPhotos(): Promise<VendorPhoto[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("vendor_photos")
    .select("id, vendor_id, url, position")
    .eq("vendor_id", user.id)
    .order("position", { ascending: true });
  return (data as VendorPhoto[]) ?? [];
}

export async function getMyAvailability(): Promise<Availability[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("vendor_availability")
    .select("id, date, status, note")
    .eq("prestataire_id", user.id)
    .order("date", { ascending: true });
  return (data as Availability[]) ?? [];
}

export async function getProStats(): Promise<ProStats> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const empty: ProStats = {
    demandes: 0,
    quotesSent: 0,
    quotesAccepted: 0,
    revenue: 0,
    views: 0,
    rating: 0,
    reviews: 0,
  };
  if (!user) return empty;

  const [convs, quotes, vendor] = await Promise.all([
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("prestataire_id", user.id),
    supabase.from("quotes").select("amount, status").eq("prestataire_id", user.id),
    supabase
      .from("vendors")
      .select("id, rating, reviews")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const qs = (quotes.data as { amount: number; status: string }[] | null) ?? [];
  const accepted = qs.filter((q) => q.status === "accepté");
  const v = vendor.data as { id: string; rating: number; reviews: number } | null;

  let views = 0;
  if (v?.id) {
    const { count } = await supabase
      .from("profile_views")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", v.id);
    views = count ?? 0;
  }

  return {
    demandes: convs.count ?? 0,
    quotesSent: qs.length,
    quotesAccepted: accepted.length,
    revenue: accepted.reduce((s, q) => s + Number(q.amount), 0),
    views,
    rating: Number(v?.rating ?? 0),
    reviews: v?.reviews ?? 0,
  };
}
