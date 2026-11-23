import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select("name, category, city, verified, rating, reviews, user_id")
    .eq("id", params.id)
    .maybeSingle();
  const vendor = data as {
    name: string;
    category: string;
    city: string | null;
    verified: boolean;
    rating: number;
    reviews: number;
    user_id: string | null;
  } | null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #6C3CE1 0%, #1E1240 100%)",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#D9B25F", fontWeight: 600 }}>
          Misstice
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: "#FAFAF9",
            marginTop: 20,
          }}
        >
          {vendor?.name ?? "Prestataire"}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#EFE9FD", marginTop: 12 }}>
          {vendor?.category ?? ""}
          {vendor?.city ? ` · ${vendor.city}` : ""}
        </div>
        <div style={{ display: "flex", marginTop: 32, gap: 20 }}>
          {vendor?.verified && vendor.user_id && (
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#1E1240",
                background: "#FAFAF9",
                padding: "10px 20px",
                borderRadius: 999,
              }}
            >
              Vérifié par Misstice
            </div>
          )}
          {vendor && vendor.reviews > 0 && (
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#1E1240",
                background: "#FAFAF9",
                padding: "10px 20px",
                borderRadius: 999,
              }}
            >
              {vendor.rating.toFixed(1).replace(".", ",")} · {vendor.reviews} avis
            </div>
          )}
        </div>
      </div>
    ),
    size
  );
}
