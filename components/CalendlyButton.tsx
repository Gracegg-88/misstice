"use client";

import Script from "next/script";
import { CalendarClock } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/ggraceheritage/30min";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

// Bouton "Réserver un appel" : ouvre le popup Calendly officiel s'il a eu le
// temps de charger, sinon se rabat sur un lien classique vers Calendly (pas
// de bouton mort en cas de script lent/bloqué).
export default function CalendlyButton({
  label = "Réserver un appel",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://assets.calendly.com/assets/external/widget.css"
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
      />
      <a
        href={CALENDLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (window.Calendly) {
            e.preventDefault();
            window.Calendly.initPopupWidget({ url: CALENDLY_URL });
          }
        }}
        className={className}
      >
        <CalendarClock size={17} />
        {label}
      </a>
    </>
  );
}
