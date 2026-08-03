import { createClient } from "@/lib/supabase/server";
import AvisClient from "@/components/admin/AvisClient";

type Row = {
  id: string;
  rating: number;
  event_type: string | null;
  body: string | null;
  author_name: string | null;
  created_at: string;
  vendors: { name: string } | { name: string }[] | null;
};

export default async function AdminAvis() {
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, event_type, body, author_name, created_at, vendors(name)")
    .order("created_at", { ascending: false });

  const reviews = ((data as Row[]) ?? []).map((r) => {
    const v = Array.isArray(r.vendors) ? r.vendors[0] : r.vendors;
    return {
      id: r.id,
      rating: r.rating,
      eventType: r.event_type,
      body: r.body,
      authorName: r.author_name,
      createdAt: r.created_at,
      vendorName: v?.name ?? "Prestataire supprimé",
    };
  });

  return <AvisClient reviews={reviews} />;
}
