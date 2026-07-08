import { createClient } from "@/lib/supabase/server";
import type { Vendor } from "@/components/explorer/vendors";
import type { Pkg, Review } from "@/components/explorer/profileData";

type Row = {
  id: string;
  name: string;
  category: string;
  city: string | null;
  region: string | null;
  price_level: number;
  price_from: string | null;
  rating: number;
  reviews: number;
  verified: boolean;
  response_hours: number;
  response_rate: number;
  languages: string[] | null;
  tagline: string | null;
  review_snippet: string | null;
  review_author: string | null;
  grad: string;
  image: string | null;
  user_id: string | null;
};

function map(r: Row): Vendor {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    city: r.city ?? "",
    region: r.region ?? "",
    priceLevel: (r.price_level as 1 | 2 | 3) ?? 2,
    priceFrom: r.price_from ?? "",
    rating: Number(r.rating),
    reviews: r.reviews,
    verified: r.verified,
    responseHours: r.response_hours,
    responseRate: r.response_rate,
    languages: r.languages ?? [],
    tagline: r.tagline ?? "",
    reviewSnippet: r.review_snippet ?? undefined,
    reviewAuthor: r.review_author ?? undefined,
    grad: r.grad,
    img: r.image ?? "",
    userId: r.user_id ?? null,
  };
}

/** Tous les prestataires de l'annuaire (triés par position). */
export async function getVendors(): Promise<Vendor[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .order("position", { ascending: true });
  return ((data as Row[]) ?? []).map(map);
}

/** Catégories de prestataire (gérées depuis l'admin). */
export async function getCategories(): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendor_categories")
    .select("name")
    .order("position", { ascending: true });
  return ((data as { name: string }[]) ?? []).map((c) => c.name);
}

/** Formules réelles d'un prestataire inscrit (pour sa fiche publique). */
export async function getPublicPackages(userId: string): Promise<Pkg[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendor_packages")
    .select("name, price, features, popular, position")
    .eq("vendor_id", userId)
    .order("position", { ascending: true });
  return (
    (data as
      | {
          name: string;
          price: string | null;
          features: string[] | null;
          popular: boolean;
        }[]
      | null) ?? []
  ).map((p) => ({
    name: p.name,
    price: p.price ?? "Sur devis",
    popular: p.popular,
    features: p.features ?? [],
  }));
}

/** Photos du book d'un prestataire inscrit (pour sa fiche publique). */
export async function getPublicPhotos(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendor_photos")
    .select("url, position")
    .eq("vendor_id", userId)
    .order("position", { ascending: true });
  return ((data as { url: string }[] | null) ?? []).map((p) => p.url);
}

/** Avis réels d'un prestataire (les plus récents d'abord). */
export async function getVendorReviews(vendorId: string): Promise<Review[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("author_name, rating, event_type, body, created_at")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  return (
    (data as
      | {
          author_name: string | null;
          rating: number;
          event_type: string | null;
          body: string | null;
          created_at: string;
        }[]
      | null) ?? []
  ).map((r) => {
    const author = r.author_name?.trim() || "Client";
    return {
      author,
      initial: (author[0] || "C").toUpperCase(),
      date: new Date(r.created_at).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
      rating: r.rating,
      text: r.body ?? "",
      event: r.event_type?.trim() || "Prestation",
    };
  });
}

/** Statistiques d'avis : moyenne, total, répartition par étoile. */
export async function getReviewStats(vendorId: string): Promise<{
  avg: number;
  count: number;
  breakdown: { stars: number; pct: number }[];
}> {
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("vendor_id", vendorId);
  const ratings = ((data as { rating: number }[] | null) ?? []).map(
    (r) => r.rating
  );
  const count = ratings.length;
  const avg = count
    ? Math.round((ratings.reduce((s, r) => s + r, 0) / count) * 10) / 10
    : 0;
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    pct: count
      ? Math.round((ratings.filter((r) => r === stars).length / count) * 100)
      : 0,
  }));
  return { avg, count, breakdown };
}

/** Un prestataire par son id. */
export async function getVendor(id: string): Promise<Vendor | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as Row;
  const vendor = map(row);

  // Pour un prestataire inscrit, on récupère sa vraie description.
  if (row.user_id) {
    const { data: vp } = await supabase
      .from("vendor_profiles")
      .select("about")
      .eq("id", row.user_id)
      .maybeSingle();
    vendor.about = (vp as { about: string | null } | null)?.about ?? null;
  }

  return vendor;
}
