/**
 * Carnet de Confiance — répertoire d’accueil compact.
 * Objectif: orienter vers les routes existantes sans dupliquer les contenus SEO, FAQ ou légaux sur la page d’accueil.
 */
import { ArrowRight, ShieldCheck, FileCheck2, LockKeyhole } from "lucide-react";

const destinations = [
  {
    eyebrow: "Je prépare un moment",
    title: "Créer mon événement",
    body: "Choisissez votre occasion, posez les premières informations et retrouvez votre espace de préparation.",
    href: "/creer",
    className: "bg-ink text-cream",
  },
  {
    eyebrow: "Je cherche les bonnes personnes",
    title: "Explorer les prestataires",
    body: "Comparez les profils vérifiés, les disponibilités et les services sans perdre le fil de votre projet.",
    href: "/prestataires",
    className: "bg-festif-soft text-plum",
  },
  {
    eyebrow: "Je veux des repères",
    title: "Consulter les guides",
    body: "Retrouvez les méthodes, budgets et checklists adaptés à chaque type d’événement.",
    href: "/comment-ca-marche",
    className: "bg-white/60 text-plum",
  },
];

export default function HomeDirectory() {
  return (
    <section aria-labelledby="orienter-title" className="bg-cream px-4 py-14 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-content">
        <div className="grid items-end gap-5 pb-8 lg:grid-cols-[1.15fr_.65fr]">
          <div>
            <p className="mb-3 font-label text-[10px] font-medium uppercase tracking-[0.15em] text-festif">Un point de départ, pas un tunnel</p>
            <h2 id="orienter-title" className="max-w-[15ch] font-display text-3xl font-semibold leading-[1.02] tracking-tight text-plum sm:text-4xl">
              Choisissez la prochaine décision, nous gardons le reste en ordre.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate sm:text-base">
            L’accueil sert à vous orienter rapidement. Les détails, les guides et les échanges restent dans leurs espaces dédiés.
          </p>
        </div>

        <div className="mt-7 grid gap-3 lg:grid-cols-3">
          {destinations.map((destination, index) => (
            <a
              key={destination.href}
              href={destination.href}
              className={`group relative flex min-h-64 flex-col overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-1 ${destination.className}`}
            >
              <span className="font-label text-[10px] font-medium uppercase tracking-[0.14em] opacity-70">0{index + 1} · {destination.eyebrow}</span>
              <h3 className="mt-auto max-w-[14ch] font-display text-3xl font-semibold leading-none tracking-tight first-letter:text-festif">{destination.title}</h3>
              <p className="mt-3 max-w-sm text-sm font-light leading-relaxed opacity-75">{destination.body}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                Ouvrir <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>

        <div className="mt-7 grid gap-4 pt-7 md:grid-cols-3">
          <div className="flex gap-3 text-sm text-slate"><ShieldCheck className="mt-0.5 shrink-0 text-festif" size={20} /><p><b className="text-plum">Prestataires vérifiés.</b><br />Un contrôle réel avant publication.</p></div>
          <div className="flex gap-3 text-sm text-slate"><LockKeyhole className="mt-0.5 shrink-0 text-festif" size={20} /><p><b className="text-plum">Coordonnées protégées.</b><br />Débloquées seulement après acceptation du devis.</p></div>
          <div className="flex gap-3 text-sm text-slate"><FileCheck2 className="mt-0.5 shrink-0 text-festif" size={20} /><p><b className="text-plum">Décisions au même endroit.</b><br />Devis, projet et prochaines actions restent centralisés.</p></div>
        </div>
      </div>
    </section>
  );
}
