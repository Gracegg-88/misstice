// URL de base de confiance pour les liens dans les e-mails.
// Priorité à NEXT_PUBLIC_SITE_URL (configurée) pour éviter l'injection via
// l'en-tête Host ; repli sur l'origine de la requête sinon.
export function siteUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  const proto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
