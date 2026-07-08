import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const TIMEOUT_MS = 5000;
const MAX_BYTES = 2_000_000; // 2 Mo
const MAX_REDIRECTS = 3;

/** IP privée / loopback / link-local / interne → à bloquer (anti-SSRF). */
function isPrivateIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) {
    const p = ip.split(".").map(Number);
    if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
    const [a, b] = p;
    if (a === 10) return true; // 10/8
    if (a === 127) return true; // loopback
    if (a === 0) return true; // 0/8
    if (a === 169 && b === 254) return true; // link-local / métadonnées cloud
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
    if (a === 192 && b === 168) return true; // 192.168/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (v === 6) {
    const ip6 = ip.toLowerCase();
    if (ip6 === "::1" || ip6 === "::") return true;
    if (ip6.startsWith("fe80") || ip6.startsWith("fc") || ip6.startsWith("fd"))
      return true;
    // IPv4-mapped (::ffff:a.b.c.d)
    const mapped = ip6.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }
  return true; // format inconnu → on refuse
}

/** Valide le schéma et interdit toute cible interne (résolution DNS incluse). */
async function assertSafeUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("URL invalide");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Schéma non autorisé");
  }
  const host = u.hostname;
  let addrs: string[];
  if (net.isIP(host)) {
    addrs = [host];
  } else {
    const results = await dns.lookup(host, { all: true });
    addrs = results.map((r) => r.address);
  }
  if (addrs.length === 0 || addrs.some(isPrivateIp)) {
    throw new Error("Cible interne interdite");
  }
  return u;
}

/** fetch sûr : redirections suivies manuellement et revalidées à chaque saut. */
async function safeFetch(raw: string): Promise<Response> {
  let current = raw;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const u = await assertSafeUrl(current);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(u.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,image/*,video/*,*/*",
        },
        redirect: "manual",
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirection invalide");
      current = new URL(loc, u).toString();
      continue;
    }
    return res;
  }
  throw new Error("Trop de redirections");
}

/** Lit le corps en bornant la taille (anti-DoS mémoire). */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

export async function GET(request: Request) {
  // Auth requise : pas d'appel anonyme (anti-SSRF / anti-abus).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Lien manquant." }, { status: 400 });
  }

  try {
    const res = await safeFetch(url);

    const ct = res.headers.get("content-type") || "";
    if (ct.startsWith("image/")) {
      return NextResponse.json({ mediaUrl: url, type: "image" });
    }
    if (ct.startsWith("video/")) {
      return NextResponse.json({ mediaUrl: url, type: "video" });
    }

    const html = await readCapped(res);

    const meta = (key: string): string | undefined => {
      const patterns = [
        new RegExp(
          `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
          "i"
        ),
        new RegExp(
          `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
          "i"
        ),
      ];
      for (const re of patterns) {
        const m = html.match(re);
        if (m?.[1]) return m[1];
      }
      return undefined;
    };

    const video =
      meta("og:video:secure_url") ||
      meta("og:video:url") ||
      meta("og:video") ||
      meta("twitter:player:stream");
    const image =
      meta("og:image:secure_url") ||
      meta("og:image") ||
      meta("twitter:image") ||
      meta("twitter:image:src");

    // Priorité à la MINIATURE (toujours une vraie image téléchargeable) ;
    // `type: video` signale qu'il s'agit d'une vidéo (TikTok/Insta/Pinterest…)
    // → on affichera la miniature + un bouton lecture vers la source.
    if (image) {
      return NextResponse.json({
        mediaUrl: decodeEntities(image),
        type: video ? "video" : "image",
      });
    }
    // Pas de miniature mais une vidéo directe → au mieux on tente la vidéo.
    if (video) {
      return NextResponse.json({ mediaUrl: decodeEntities(video), type: "video" });
    }

    return NextResponse.json(
      { error: "Aucune image/vidéo trouvée sur ce lien." },
      { status: 422 }
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de lire ce lien." },
      { status: 400 }
    );
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/")
    .replace(/&#38;/g, "&")
    .replace(/&quot;/g, '"');
}
