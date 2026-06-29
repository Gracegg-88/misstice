import { CalendarDays } from "lucide-react";

// Juin 2026 commence un lundi (1er = lundi).
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const BOOKED = [14, 15]; // événements confirmés
const PENDING = [3, 21]; // devis en attente

export default function ProCalendrier() {
  const cells = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Calendrier
      </h1>
      <p className="mt-1 text-sm text-slate">
        Vos disponibilités et événements confirmés.
      </p>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} className="text-violet" />
          <h2 className="font-display text-lg font-semibold text-plum">
            Juin 2026
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-2 text-center">
          {DAYS.map((d, i) => (
            <span key={i} className="text-xs font-medium text-slate">
              {d}
            </span>
          ))}
          {cells.map((n) => {
            const booked = BOOKED.includes(n);
            const pending = PENDING.includes(n);
            return (
              <div
                key={n}
                className={`flex aspect-square items-center justify-center rounded-xl text-sm ${
                  booked
                    ? "bg-violet font-semibold text-white"
                    : pending
                    ? "bg-festif-soft font-medium text-festif"
                    : "bg-cream text-plum hover:bg-violet-soft"
                }`}
              >
                {n}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-4 border-t border-black/5 pt-4 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-violet" />
            Événement confirmé
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-festif-soft" />
            Devis en attente
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-cream" />
            Disponible
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate">
        Bientôt : synchronisation avec Google Agenda et blocage automatique des
        dates réservées.
      </p>
    </div>
  );
}
