"use client";

import { useState } from "react";
import { Check, Copy, Camera, MessageCircle, Image as ImageIcon } from "lucide-react";
import EmailSignatureGenerator from "@/components/pro/EmailSignatureGenerator";

function buildUrl(vendorId: string, slug: string | null, src: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = slug ? `${origin}/p/${slug}` : `${origin}/prestataires/${vendorId}`;
  return `${base}?src=${encodeURIComponent(src)}`;
}

export default function SharePanel({
  vendorId,
  slug,
  company,
  category,
  city,
  verified,
}: {
  vendorId: string | null;
  slug: string | null;
  company: string;
  category: string;
  city: string;
  verified: boolean;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Presse-papiers indisponible : rien de plus à faire.
    }
  };

  if (!vendorId) {
    return (
      <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-plum">Partager</h2>
        <p className="mt-2 text-sm text-slate">
          Enregistrez vos informations (section « Informations » ci-dessus)
          pour activer le lien de partage, la carte et la signature email.
        </p>
      </section>
    );
  }

  const linkUrl = buildUrl(vendorId, slug, "lien");

  return (
    <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-plum">Partager</h2>
      <p className="mt-1 text-sm text-slate">
        Un seul lien vers votre fiche, à mettre partout — bio Instagram, carte
        de visite, signature email.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum">
        <span className="truncate">{linkUrl}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy("insta", buildUrl(vendorId, slug, "instagram"))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-plum hover:border-violet/40"
        >
          {copied === "insta" ? <Check size={15} className="text-emerald" /> : <Camera size={15} />}
          Copier pour ma bio Instagram
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `${company} sur Misstice : ${buildUrl(vendorId, slug, "whatsapp")}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-plum hover:border-violet/40"
        >
          <MessageCircle size={15} />
          Partager sur WhatsApp
        </a>
        <button
          type="button"
          onClick={() => copy("link", linkUrl)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-plum hover:border-violet/40"
        >
          {copied === "link" ? <Check size={15} className="text-emerald" /> : <Copy size={15} />}
          Copier le lien
        </button>
        <a
          href={`/api/vendor/card/${vendorId}`}
          download
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-plum hover:border-violet/40"
        >
          <ImageIcon size={15} />
          Télécharger ma carte
        </a>
      </div>

      <div className="mt-6 border-t border-black/5 pt-6">
        <EmailSignatureGenerator
          vendorId={vendorId}
          slug={slug}
          company={company}
          category={category}
          city={city}
          verified={verified}
        />
      </div>
    </section>
  );
}
