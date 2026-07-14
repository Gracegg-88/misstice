// Valide un paramètre `?next=` de redirection interne (anti open-redirect).
// Refuse : URL absolue, protocole-relatif (`//`), et backslash (`/\evil.com`,
// que certains navigateurs traitent comme `//evil.com`).
export function safeNext(
  raw: string | null | undefined,
  fallback = "/"
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  return raw;
}
