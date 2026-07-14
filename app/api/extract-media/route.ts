import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";
import https from "node:https";
import http from "node:http";
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
    if (a === 198 && (b === 18 || b === 19)) return true; // 198.18/15 (bench)
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

/**
 * Résout l'hôte et renvoie UNE IP publique validée. Rejette si privée/interne.
 * L'IP retournée est ensuite utilisée telle quelle pour la connexion → aucune
 * seconde résolution DNS ne peut la « rebinder » (anti-TOCTOU / DNS rebinding).
 */
async function resolveSafeIp(hostname: string): Promise<string> {
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("Cible interne interdite");
    return hostname;
  }
  const results = await dns.lookup(hostname, { all: true });
  const addrs = results.map((r) => r.address);
  if (addrs.length === 0 || addrs.some(isPrivateIp)) {
    throw new Error("Cible interne interdite");
  }
  return addrs[0];
}

type FetchedResponse = {
  status: number;
  contentType: string;
  location: string | null;
  read: () => Promise<string>;
};

/**
 * Une requête GET épinglée sur l'IP validée : on se connecte à l'IP (pas au nom
 * → pas de re-résolution), tout en conservant le SNI + l'en-tête Host du nom
 * d'origine (certificat TLS et vhost corrects). Ports limités à 80/443.
 */
function requestOnce(rawUrl: string): Promise<FetchedResponse> {
  return new Promise((resolve, reject) => {
    let u: URL;
    try {
      u = new URL(rawUrl);
    } catch {
      reject(new Error("URL invalide"));
      return;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      reject(new Error("Schéma non autorisé"));
      return;
    }
    if (u.port && u.port !== "80" && u.port !== "443") {
      reject(new Error("Port non autorisé"));
      return;
    }

    resolveSafeIp(u.hostname)
      .then((ip) => {
        const isHttps = u.protocol === "https:";
        const lib = isHttps ? https : http;
        const port = u.port ? Number(u.port) : isHttps ? 443 : 80;
        const req = lib.request(
          {
            host: ip, // ← connexion à l'IP validée (anti-rebinding)
            servername: isHttps ? u.hostname : undefined, // SNI correct
            port,
            path: u.pathname + u.search,
            method: "GET",
            timeout: TIMEOUT_MS,
            headers: {
              Host: u.hostname, // ← vhost correct
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,image/*,video/*,*/*",
            },
          },
          (res) => {
            resolve({
              status: res.statusCode ?? 0,
              contentType: String(res.headers["content-type"] ?? ""),
              location: (res.headers.location as string) ?? null,
              read: () =>
                new Promise<string>((res2, rej2) => {
                  const chunks: Buffer[] = [];
                  let total = 0;
                  res.on("data", (c: Buffer) => {
                    total += c.length;
                    if (total > MAX_BYTES) {
                      res.destroy();
                    } else {
                      chunks.push(c);
                    }
                  });
                  res.on("end", () =>
                    res2(Buffer.concat(chunks).toString("utf8"))
                  );
                  res.on("error", rej2);
                }),
            });
          }
        );
        req.on("timeout", () => req.destroy(new Error("Timeout")));
        req.on("error", reject);
        req.end();
      })
      .catch(reject);
  });
}

/** Suit les redirections manuellement, chaque saut étant revalidé (IP publique). */
async function safeFetch(raw: string): Promise<FetchedResponse> {
  let current = raw;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await requestOnce(current);
    if (res.status >= 300 && res.status < 400) {
      if (!res.location) throw new Error("Redirection invalide");
      current = new URL(res.location, current).toString();
      continue;
    }
    return res;
  }
  throw new Error("Trop de redirections");
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

    const ct = res.contentType;
    if (ct.startsWith("image/")) {
      return NextResponse.json({ mediaUrl: url, type: "image" });
    }
    if (ct.startsWith("video/")) {
      return NextResponse.json({ mediaUrl: url, type: "video" });
    }

    const html = await res.read();

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
