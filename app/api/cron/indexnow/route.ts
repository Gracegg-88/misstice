import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import sitemap from "@/app/sitemap";
import { INDEXNOW_ENDPOINT, INDEXNOW_KEY } from "@/lib/indexnow";
import { SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Tâche quotidienne (voir vercel.json) : envoie à IndexNow les URL du
 * sitemap — donc uniquement des pages indexables — dont la date de
 * dernière modification est récente. Une page qui devient indexable (fiche
 * complétée, page ville qui atteint le seuil, guide publié) a une date
 * récente et part donc dans l'envoi suivant. Pas d'état à stocker : on
 * reprend une fenêtre de 26 h pour couvrir un éventuel décalage du cron.
 * ?all=1 (avec le même secret) envoie tout le sitemap, utile une fois
 * après la mise en ligne.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || !auth || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const all = new URL(request.url).searchParams.get("all") === "1";
  const since = Date.now() - 26 * 60 * 60 * 1000;
  const entries = await sitemap();
  const urls = entries
    .filter((e) => {
      if (all) return true;
      if (!e.lastModified) return false;
      return new Date(e.lastModified).getTime() >= since;
    })
    .map((e) => e.url)
    .slice(0, 10000); // limite IndexNow par requête

  if (!urls.length) return NextResponse.json({ envoyees: 0 });

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
  if (!res.ok && res.status !== 202) {
    console.error("indexnow: réponse", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ erreur: res.status, envoyees: 0 }, { status: 502 });
  }
  return NextResponse.json({ envoyees: urls.length, statut: res.status });
}
