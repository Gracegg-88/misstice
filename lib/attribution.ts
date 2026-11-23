"use client";

// Attribution d'une visite à un prestataire + un canal (?src=...), pour le
// suivi des sources et — plus tard (PR2a) — la commission réduite si le
// client réserve CE prestataire. Cookie 30 jours, posé côté client
// uniquement (jamais lu/écrit depuis un Server Component).

const COOKIE_NAME = "misstice_src";
const MAX_AGE_DAYS = 30;

export type Attribution = { vendorId: string; src: string };

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAttributionCookie(vendorId: string, src: string): void {
  const value: Attribution = { vendorId, src };
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(value)
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function getAttributionCookie(): Attribution | null {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.vendorId === "string" && typeof parsed?.src === "string") {
      return parsed as Attribution;
    }
  } catch {
    // Cookie corrompu : ignoré, pas bloquant.
  }
  return null;
}

/** Source à enregistrer pour CE prestataire précis, sinon null (le client a
 *  pu naviguer vers un autre prestataire entre-temps — pas d'attribution). */
export function attributionSourceFor(vendorId: string): string | null {
  const a = getAttributionCookie();
  return a && a.vendorId === vendorId ? a.src : null;
}
