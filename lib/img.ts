/**
 * URL optimisée pour une image locale (dossier public/) : passe par
 * l'optimiseur d'images de Next.js (/_next/image), qui sert une version
 * redimensionnée au format WebP/AVIF et mise en cache. Plusieurs images
 * éditoriales et de démonstration sont des PNG de 1 à 2 Mo : sans cela,
 * elles pénalisent fortement le LCP mobile. Les images distantes (stockage
 * Supabase, etc.) sont renvoyées telles quelles.
 * `width` doit être une taille autorisée par Next.js (640, 750, 828, 1080,
 * 1200, 1920…).
 */
export function optimizedSrc(url: string, width: 640 | 828 | 1080 | 1200 | 1920 = 1200): string {
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/_next/")) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}
