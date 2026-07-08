"use client";

import { useRouter } from "next/navigation";
import { PartyPopper, Store } from "lucide-react";

/**
 * Bascule prestataire ↔ particulier (réservée aux comptes prestataires).
 * Façon interrupteur : un clic change d'espace.
 */
export default function ModeSwitch({
  current,
}: {
  current: "pro" | "particulier";
}) {
  const router = useRouter();

  const go = (target: "pro" | "particulier") => {
    if (target === current) return;
    router.push(target === "pro" ? "/pro" : "/dashboard");
  };

  const btn = "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors";

  return (
    <div
      className="flex items-center rounded-full border border-black/10 bg-white p-0.5"
      role="group"
      aria-label="Changer d'espace"
    >
      <button
        type="button"
        onClick={() => go("particulier")}
        aria-pressed={current === "particulier"}
        className={`${btn} ${current === "particulier" ? "bg-violet text-white" : "text-slate hover:text-plum"}`}
      >
        <PartyPopper size={14} />
        <span className="hidden sm:inline">Particulier</span>
      </button>
      <button
        type="button"
        onClick={() => go("pro")}
        aria-pressed={current === "pro"}
        className={`${btn} ${current === "pro" ? "bg-violet text-white" : "text-slate hover:text-plum"}`}
      >
        <Store size={14} />
        <span className="hidden sm:inline">Prestataire</span>
      </button>
    </div>
  );
}
