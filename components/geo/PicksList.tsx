import type { DirectoryPick } from "@/lib/geo";

/**
 * Liste "Top 10" éditoriale (voir components/geo/PicksMap.tsx pour la carte
 * associée). Adresse et téléphone affichés directement (pas de clic
 * nécessaire) ; seul le lien d'itinéraire ouvre Google Maps, pour l'action
 * ponctuelle de calcul de trajet, jamais pour "voir la fiche".
 */
export default function PicksList({ picks }: { picks: DirectoryPick[] }) {
  return (
    <div className="divide-y divide-black/5">
      {picks.map((p) => (
        <div key={p.id} className="flex items-start gap-4 py-5">
          <span className="w-9 shrink-0 pt-0.5 font-display text-2xl font-semibold italic text-festif">
            {String(p.rank).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg font-semibold text-plum">
                {p.name}
              </span>
              {p.price_level && (
                <span className="rounded-full bg-violet-soft px-2 py-0.5 text-xs font-bold text-violet">
                  {p.price_level}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate">{p.description}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              <span className="text-slate">📍 {p.address}</span>
              {p.phone && (
                <a
                  href={`tel:${p.phone.replace(/\s/g, "")}`}
                  className="font-semibold text-plum hover:text-violet"
                >
                  📞 {p.phone}
                </a>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-violet hover:text-violet-dark"
              >
                ↗ Itinéraire
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
