import { BadgeCheck, Star, ShieldCheck } from "lucide-react";
import type { Vendor } from "./vendors";
import { googlePlacesEnabled } from "@/components/google/GooglePlaceCard";

/**
 * Zone de confiance Misstice : badge Vérifié, avis Misstice, note Google (si
 * la fiche Google est validée) et garantie de paiement sécurisé. Style
 * TOUJOURS identique, quel que soit le thème choisi pour la fiche (voir
 * lib/themes.ts) — ce composant n'utilise aucune couleur de thème, jamais.
 */
export default function TrustZone({ vendor }: { vendor: Vendor }) {
  const showGoogleNote = Boolean(vendor.googlePlaceId) && googlePlacesEnabled;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
        Zone de confiance Misstice
      </p>
      <ul className="mt-2.5 space-y-2 text-sm text-plum">
        {vendor.verified && vendor.userId && (
          <li className="flex items-center gap-2">
            <BadgeCheck size={16} className="shrink-0 text-violet" />
            Vérifié par Misstice (SIRET contrôlé)
          </li>
        )}
        {vendor.reviews > 0 && (
          <li className="flex items-center gap-2">
            <Star size={16} className="shrink-0 fill-garnet text-garnet" />
            {vendor.rating.toFixed(1).replace(".", ",")} · {vendor.reviews} avis
            Misstice
          </li>
        )}
        {showGoogleNote && (
          <li className="flex items-center gap-2">
            <Star size={16} className="shrink-0 text-slate" />
            Avis Google également disponibles ci-dessous
          </li>
        )}
        <li className="flex items-center gap-2">
          <ShieldCheck size={16} className="shrink-0 text-emerald" />
          Paiement et acompte sécurisés par Misstice
        </li>
      </ul>
    </div>
  );
}
