// Garde anti-XSS pour les URLs média provenant de contenu utilisateur
// (marqueurs [[img:…]] / [[vid:…]] / [[doc:…]] des messages).
// N'autorise QUE http(s) : bloque les pseudo-protocoles javascript:, data:, vbscript:…
export function safeMediaUrl(raw: string): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol === "https:" || u.protocol === "http:") return u.toString();
    return null;
  } catch {
    return null;
  }
}
