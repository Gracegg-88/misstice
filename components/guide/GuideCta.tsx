import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";

export default function GuideCta({
  href,
  label,
  accent = false,
}: {
  href: string;
  label: string;
  /** Liseré festif pulsant — réservé au CTA de conversion principal de la page. */
  accent?: boolean;
}) {
  return (
    <Reveal variant="scale" className="inline-block">
      <Link
        href={href}
        className={`ev-cta inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 ${accent ? "ev-cta-pulse" : ""}`}
      >
        {label}
        <ArrowRight size={16} />
      </Link>
    </Reveal>
  );
}
