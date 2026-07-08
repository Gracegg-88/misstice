import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Signe une requête d'upload Cloudinary. Le secret ne quitte jamais le serveur.
 * Réservé aux utilisateurs connectés (sinon signature d'upload gratuite pour
 * n'importe quel anonyme). Le dossier est scopé à l'utilisateur.
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CLOUDINARY_API_SECRET manquant." },
      { status: 500 }
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `misstice/inspiration/${user.id}`;

  // Paramètres triés par ordre alphabétique, puis le secret concaténé.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(toSign + secret)
    .digest("hex");

  return NextResponse.json({ signature, timestamp, folder });
}
