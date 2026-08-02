"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Bascule prestataire ↔ particulier — un clic change d'espace, sur le même
 * compte. Pour un particulier qui n'a jamais activé le statut prestataire
 * (activatesOnClick), le premier clic sur "Prestataire" l'active d'abord
 * (become_prestataire(), déjà utilisé pour le même besoin côté Google OAuth)
 * avant de l'emmener remplir sa fiche.
 */
export default function ModeSwitch({
  current,
  activatesOnClick = false,
}: {
  current: "pro" | "particulier";
  activatesOnClick?: boolean;
}) {
  const router = useRouter();
  const [activating, setActivating] = useState(false);

  const go = async (target: "pro" | "particulier") => {
    if (target === current || activating) return;
    if (target === "pro" && activatesOnClick) {
      setActivating(true);
      const supabase = createClient();
      const { error } = await supabase.rpc("become_prestataire");
      setActivating(false);
      if (error) return;
      router.push("/pro/profil");
      router.refresh();
      return;
    }
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
        disabled={activating}
        onClick={() => go("particulier")}
        aria-pressed={current === "particulier"}
        className={`${btn} disabled:opacity-60 ${current === "particulier" ? "bg-violet text-white" : "text-slate hover:text-plum"}`}
      >
        <PartyPopper size={14} />
        <span className="hidden sm:inline">Particulier</span>
      </button>
      <button
        type="button"
        disabled={activating}
        onClick={() => go("pro")}
        aria-pressed={current === "pro"}
        className={`${btn} disabled:opacity-60 ${current === "pro" ? "bg-violet text-white" : "text-slate hover:text-plum"}`}
      >
        <Store size={14} />
        <span className="hidden sm:inline">
          {activating ? "Activation…" : "Prestataire"}
        </span>
      </button>
    </div>
  );
}
