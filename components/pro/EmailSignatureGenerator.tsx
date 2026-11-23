"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Génère une signature email (HTML, compatible Gmail/Outlook — tableaux et
 * styles en ligne, jamais de flex/grid) : nom, métier, ville, badge Vérifié,
 * bouton "Demander un devis" vers la fiche (avec ?src=signature), mention
 * "via Misstice". Rien d'autre : pas de coordonnées, pas de lien externe.
 */
function buildSignatureHtml({
  url,
  company,
  category,
  city,
  verified,
}: {
  url: string;
  company: string;
  category: string;
  city: string;
  verified: boolean;
}): string {
  const verifiedLine = verified
    ? `<tr><td style="padding:2px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1E1240;">✓ Vérifié par Misstice</td></tr>`
    : "";
  return `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td style="padding:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#1E1240;">${company}</td>
  </tr>
  <tr>
    <td style="padding:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5B564E;">${category}${city ? ` · ${city}` : ""}</td>
  </tr>
  ${verifiedLine}
  <tr>
    <td style="padding:8px 0 4px 0;">
      <a href="${url}" style="display:inline-block;background:#6C3CE1;color:#FAFAF9;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;padding:8px 16px;border-radius:6px;">Demander un devis</a>
    </td>
  </tr>
  <tr>
    <td style="padding:4px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9A9590;">via Misstice</td>
  </tr>
</table>`.trim();
}

export default function EmailSignatureGenerator({
  vendorId,
  slug,
  company,
  category,
  city,
  verified,
}: {
  vendorId: string;
  slug: string | null;
  company: string;
  category: string;
  city: string;
  verified: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = slug ? `${origin}/p/${slug}` : `${origin}/prestataires/${vendorId}`;
  const url = `${base}?src=signature`;
  const html = buildSignatureHtml({ url, company, category, city, verified });

  const copySignature = async () => {
    try {
      if (typeof ClipboardItem !== "undefined") {
        const item = new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([`${company} — ${category}${city ? ` · ${city}` : ""} — ${url}`], {
            type: "text/plain",
          }),
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(html);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Presse-papiers indisponible : rien de plus à faire.
    }
  };

  return (
    <div>
      <h3 className="font-display text-base font-semibold text-plum">
        Signature email
      </h3>
      <p className="mt-1 text-sm text-slate">
        À coller dans votre signature Gmail ou Outlook.
      </p>
      <div className="mt-3 rounded-xl border border-black/10 bg-cream p-4">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <button
        type="button"
        onClick={copySignature}
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-plum hover:border-violet/40"
      >
        {copied ? <Check size={15} className="text-emerald" /> : <Copy size={15} />}
        {copied ? "Signature copiée" : "Copier ma signature"}
      </button>
    </div>
  );
}
