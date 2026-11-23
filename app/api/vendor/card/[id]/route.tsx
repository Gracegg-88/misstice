import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Carte à partager — générée AUTOMATIQUEMENT, aucun réglage en formule
 * gratuite (voir SharePanel.tsx). Image basse définition, bandeau "Créé avec
 * Misstice" + QR code vers la fiche (?src=carte). Disponible même pour une
 * inscription non finalisée (bouton admin "Générer sa carte").
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select("name, category, city, verified, user_id")
    .eq("id", params.id)
    .maybeSingle();
  const vendor = data as {
    name: string;
    category: string;
    city: string | null;
    verified: boolean;
    user_id: string | null;
  } | null;
  if (!vendor) {
    return new Response("Prestataire introuvable.", { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const targetUrl = `${origin}/prestataires/${params.id}?src=carte`;
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    margin: 1,
    width: 240,
    color: { dark: "#1E1240", light: "#FAFAF9" },
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "600px",
          height: "800px",
          display: "flex",
          flexDirection: "column",
          background: "#FAFAF9",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "48px",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#1E1240" }}>
            {vendor.name}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#5B564E", marginTop: 8 }}>
            {vendor.category}
            {vendor.city ? ` · ${vendor.city}` : ""}
          </div>
          {vendor.verified && vendor.user_id && (
            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontSize: 18,
                color: "#6C3CE1",
                background: "#F1ECFD",
                padding: "8px 16px",
                borderRadius: 999,
                alignSelf: "flex-start",
              }}
            >
              Vérifié par Misstice
            </div>
          )}
          <div
            style={{
              display: "flex",
              marginTop: 48,
              alignSelf: "center",
              padding: 16,
              background: "#FFFFFF",
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} width={240} height={240} alt="" />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            background: "#1E1240",
            color: "#FAFAF9",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          Créé avec Misstice
        </div>
      </div>
    ),
    { width: 600, height: 800 }
  );
}
