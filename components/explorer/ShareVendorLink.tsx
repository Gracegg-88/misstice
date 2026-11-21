"use client";

import { useState } from "react";
import { Share2, Link as LinkIcon, Check } from "lucide-react";

/**
 * Bouton de partage de la fiche — pour que le prestataire mette ce lien dans
 * sa bio Instagram/TikTok, sa carte de visite, etc. Toujours la même URL
 * canonique (/prestataires/[id]) : aucune version "Linktree" séparée.
 */
export default function ShareVendorLink({
  vendorId,
  vendorName,
}: {
  vendorId: string;
  vendorName: string;
}) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/prestataires/${vendorId}`
      : `/prestataires/${vendorId}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: vendorName, url });
        return;
      } catch {
        // Annulé ou indisponible → repli sur la copie.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible : rien à afficher de plus, pas bloquant.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-xl border border-plum/15 bg-white/80 px-3 py-1.5 text-xs font-semibold text-plum backdrop-blur-sm transition-colors hover:border-violet/40"
    >
      {copied ? (
        <>
          <Check size={14} className="text-emerald" />
          Lien copié
        </>
      ) : (
        <>
          {typeof navigator !== "undefined" && "share" in navigator ? (
            <Share2 size={14} />
          ) : (
            <LinkIcon size={14} />
          )}
          Partager cette fiche
        </>
      )}
    </button>
  );
}
