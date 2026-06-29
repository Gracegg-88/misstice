import { CalendarHeart, MapPin, User, Clock } from "lucide-react";
import Reveal from "@/components/Reveal";

type Moment = {
  time: string;
  dur: string;
  title: string;
  desc?: string;
  place: string;
  who?: string;
  vendor?: string;
  color: string;
};

const MOMENTS: Moment[] = [
  { time: "08:00", dur: "2h", title: "Coiffure & Maquillage", desc: "Préparation chez les parents de Sophie", place: "Maison Dubois, Paris 16e", who: "Sophie + demoiselles", vendor: "Salon Élégance", color: "#EC4899" },
  { time: "10:30", dur: "1h", title: "Photos de préparatifs", place: "Maison Dubois", who: "Sophie", vendor: "Studio Lumière", color: "#6C3CE1" },
  { time: "12:00", dur: "1h30", title: "Déjeuner en famille", place: "Maison Dubois", who: "Famille", color: "#10B981" },
  { time: "13:30", dur: "30min", title: "Transport vers la cérémonie", place: "Mairie du 16e", who: "Papa", color: "#F59E0B" },
  { time: "14:00", dur: "1h", title: "Cérémonie civile & laïque", desc: "Mariage civil suivi de la cérémonie laïque", place: "Mairie du 16e arrondissement", who: "Officiant", color: "#EF4444" },
  { time: "15:30", dur: "1h30", title: "Cocktail de bienvenue", desc: "Champagne, petits fours, photos", place: "Jardin de Salle Élégance", vendor: "Saveurs d'Afrique", color: "#F59E0B" },
  { time: "17:00", dur: "1h", title: "Photos officielles de groupe", place: "Parc adjacent", vendor: "Studio Lumière", color: "#6C3CE1" },
  { time: "18:30", dur: "30min", title: "Entrée des mariés & discours des témoins", place: "Salle Élégance", who: "Témoins", color: "#A855F7" },
  { time: "19:00", dur: "3h", title: "Dîner de gala", desc: "Menu 5 services avec animation musicale", place: "Salle Élégance", vendor: "Saveurs d'Afrique", color: "#10B981" },
  { time: "22:00", dur: "4h", title: "Soirée dansante", desc: "Ouverture du bal par les mariés, DJ set", place: "Salle Élégance", vendor: "DJ Maestro", color: "#FF8C42" },
  { time: "00:00", dur: "30min", title: "Découpe de la pièce montée", place: "Salle Élégance", vendor: "Pâtisserie Royale", color: "#EC4899" },
  { time: "02:00", dur: "", title: "Fin de soirée", place: "Salle Élégance", color: "#6B7280" },
];

export default function PlanningPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Planning du Jour J
      </h1>
      <p className="mt-1 text-sm text-slate">
        Samedi 15 Juin 2026 · Mariage de Sophie &amp; Marc
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="space-y-3 lg:col-span-2">
          {MOMENTS.map((m, i) => (
            <Reveal key={i} delay={i * 60}>
              <div
                className="flex gap-4 rounded-2xl border border-black/5 bg-white p-4"
                style={{ borderLeft: `4px solid ${m.color}` }}
              >
              <div className="w-14 shrink-0 text-right">
                <p className="font-display text-base font-semibold text-plum">
                  {m.time}
                </p>
                {m.dur && <p className="text-xs text-slate">{m.dur}</p>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-plum">{m.title}</p>
                {m.desc && <p className="text-sm text-slate">{m.desc}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {m.place}
                  </span>
                  {m.who && (
                    <span className="inline-flex items-center gap-1">
                      <User size={12} />
                      {m.who}
                    </span>
                  )}
                  {m.vendor && (
                    <span className="rounded-md bg-violet-soft px-2 py-0.5 font-medium text-violet">
                      {m.vendor}
                    </span>
                  )}
                </div>
              </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Résumé */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-black/5 bg-white p-6">
            <div className="flex items-center gap-2">
              <CalendarHeart size={18} className="text-violet" />
              <h2 className="font-display text-lg font-semibold text-plum">
                Résumé du jour J
              </h2>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Date", "15 Juin 2026"],
                ["Début", "08h00"],
                ["Fin prévue", "~02h00"],
                ["Étapes", "12 moments"],
                ["Prestataires", "5 présents"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0 last:pb-0">
                  <dt className="text-slate">{k}</dt>
                  <dd className="font-semibold text-plum">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-cream p-3 text-xs text-slate">
              <Clock size={14} className="text-violet" />
              Une journée de 18h, minutée pour que rien ne soit oublié.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
