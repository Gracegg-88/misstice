import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Style Guide — Misstice",
  robots: { index: false, follow: false },
};

// Miroir des valeurs de tailwind.config.ts, uniquement pour affichage
// (hex + ratio de contraste) sur cette page. La config Tailwind reste la
// seule source de vérité pour les classes utilisées dans les composants.
type Swatch = {
  name: string;
  token: string;
  hex: string;
  tileClass: string;
  labelClass: "text-cream" | "text-plum";
  usage: string;
  contrastNote: string;
};

const swatches: Swatch[] = [
  {
    name: "Violet",
    token: "violet",
    hex: "#6C3CE1",
    tileClass: "bg-violet",
    labelClass: "text-cream",
    usage: "Primaire / action — CTA, liens importants",
    contrastNote: "Texte cream : 5.96:1 — AA texte normal ✓",
  },
  {
    name: "Violet dark",
    token: "violet-dark",
    hex: "#5A2FC4",
    tileClass: "bg-violet-dark",
    labelClass: "text-cream",
    usage: "Survol des boutons violets",
    contrastNote: "Texte cream : 7.62:1 — AAA ✓",
  },
  {
    name: "Violet soft",
    token: "violet-soft",
    hex: "#F1ECFD",
    tileClass: "bg-violet-soft",
    labelClass: "text-plum",
    usage: "Badges, surfaces discrètes",
    contrastNote: "Texte plum : 14.75:1 — AAA ✓",
  },
  {
    name: "Festif",
    token: "festif",
    hex: "#FF8C42",
    tileClass: "bg-festif",
    labelClass: "text-plum",
    usage: "Accent chaleureux — usage ponctuel UNIQUEMENT (~10% max d'une section, jamais en grand aplat)",
    contrastNote: "Texte plum : 7.38:1 — AA ✓ · texte cream : 2.21:1 — échoue, ne pas utiliser",
  },
  {
    name: "Festif soft",
    token: "festif-soft",
    hex: "#FFF1E6",
    tileClass: "bg-festif-soft",
    labelClass: "text-plum",
    usage: "Badges festifs",
    contrastNote: "Texte plum : 15.41:1 — AAA ✓",
  },
  {
    name: "Emerald",
    token: "emerald",
    hex: "#10B981",
    tileClass: "bg-emerald",
    labelClass: "text-plum",
    usage: "Confirmations, succès",
    contrastNote: "Texte plum : 6.72:1 — AA ✓ · texte cream : 2.43:1 — échoue, ne pas utiliser",
  },
  {
    name: "Emerald soft",
    token: "emerald-soft",
    hex: "#E7F8F1",
    tileClass: "bg-emerald-soft",
    labelClass: "text-plum",
    usage: "Badges de succès",
    contrastNote: "Texte plum : 15.51:1 — AAA ✓",
  },
  {
    name: "Navy",
    token: "navy",
    hex: "#2B4C7E",
    tileClass: "bg-navy",
    labelClass: "text-cream",
    usage: "Accent premium neutre — mise en avant prestataire, badges \"premium\". Jamais en usage principal.",
    contrastNote: "Texte cream : 8.25:1 — AAA ✓",
  },
  {
    name: "Navy soft",
    token: "navy-soft",
    hex: "#EAF0F8",
    tileClass: "bg-navy-soft",
    labelClass: "text-plum",
    usage: "Fond léger pour badges navy",
    contrastNote: "Texte plum : 14.88:1 — AAA ✓",
  },
  {
    name: "Cream",
    token: "cream",
    hex: "#FAFAF9",
    tileClass: "bg-cream",
    labelClass: "text-plum",
    usage: "Fond principal — jamais blanc pur (#FFFFFF)",
    contrastNote: "Texte plum : 16.33:1 — AAA ✓",
  },
  {
    name: "Ink",
    token: "ink",
    hex: "#1E1B2E",
    tileClass: "bg-ink",
    labelClass: "text-cream",
    usage: "Sections sombres / \"écrin\" — jamais noir pur (#000000)",
    contrastNote: "Texte cream : 16.07:1 — AAA ✓",
  },
  {
    name: "Plum",
    token: "plum",
    hex: "#1A1A2E",
    tileClass: "bg-plum",
    labelClass: "text-cream",
    usage: "Texte principal, titres",
    contrastNote: "Sur cream : 16.33:1 — AAA ✓",
  },
  {
    name: "Slate",
    token: "slate",
    hex: "#6B7280",
    tileClass: "bg-slate",
    labelClass: "text-cream",
    usage: "Texte secondaire, sous-titres",
    contrastNote: "Sur cream : 4.63:1 — AA texte normal (limite) ✓",
  },
];

const gradients = [
  {
    name: "gradient-primary",
    className: "bg-gradient-primary",
    stops: "violet → violet-dark, 135°",
    usage: "Boutons CTA du quotidien, hero discret",
  },
  {
    name: "gradient-premium",
    className: "bg-gradient-premium",
    stops: "violet → navy, 135°",
    usage: "Sections premium, mise en avant prestataire, hero principal",
  },
  {
    name: "gradient-soft",
    className: "bg-gradient-soft",
    stops: "violet-soft → cream, 135°",
    usage: "Fonds de section doux, transitions",
  },
];

function Swatch({ s }: { s: Swatch }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-plum/10">
      <div
        className={`flex h-28 flex-col justify-end p-4 ${s.tileClass} ${s.labelClass}`}
      >
        <p className="font-display text-lg font-semibold">{s.name}</p>
        <p className="font-mono text-xs opacity-90">{s.hex}</p>
      </div>
      <div className="space-y-1.5 bg-cream p-4">
        <p className="font-mono text-[11px] text-violet">{s.token}</p>
        <p className="text-sm text-plum">{s.usage}</p>
        <p className="text-xs text-slate">{s.contrastNote}</p>
      </div>
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <main className="min-h-screen bg-cream pb-24">
      <div className="mx-auto max-w-content px-4 py-14 sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-violet">
          Interne — non indexé
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
          Style guide — Palette Misstice
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate">
          Positionnement neutre et premium : chaleureux sans tomber dans le
          pastel/rose/féminin marqué. Toutes les valeurs ci-dessous vivent
          dans <code className="rounded bg-violet-soft px-1.5 py-0.5 text-violet">tailwind.config.ts</code> —
          aucune couleur ne doit être écrite en dur dans un composant.
        </p>

        {/* ── Palette ── */}
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-plum">
            Couleurs
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {swatches.map((s) => (
              <Swatch key={s.token} s={s} />
            ))}
          </div>
        </section>

        {/* ── Dégradés ── */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-plum">
            Dégradés
          </h2>
          <p className="mt-1 text-sm text-slate">
            Aucun dégradé violet → festif en grand format : l&apos;orange
            reste une touche ponctuelle, jamais un aplat dominant.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {gradients.map((g) => (
              <div
                key={g.name}
                className="overflow-hidden rounded-2xl border border-plum/10"
              >
                <div className={`h-28 ${g.className}`} />
                <div className="space-y-1.5 bg-cream p-4">
                  <p className="font-mono text-xs text-violet">{g.name}</p>
                  <p className="text-xs text-slate">{g.stops}</p>
                  <p className="text-sm text-plum">{g.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Exemples vivants ── */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-plum">
            Exemples
          </h2>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button className="rounded-2xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-cream shadow-lg shadow-violet/25">
              Créer mon événement
            </button>
            <button className="rounded-2xl bg-gradient-premium px-6 py-3 text-sm font-semibold text-cream shadow-lg shadow-navy/20">
              Prestataire premium
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-3 py-1.5 text-xs font-semibold text-plum">
              ● Vérifié
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-soft px-3 py-1.5 text-xs font-semibold text-plum">
              ★ Premium
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-festif-soft px-3 py-1.5 text-xs font-semibold text-plum">
              ✦ Offre limitée
            </span>
          </div>
          <div className={"mt-4 rounded-2xl bg-gradient-soft p-8"}>
            <p className="max-w-md text-sm text-plum">
              Fond doux (gradient-soft) pour une section de transition, avec
              du texte plum au-dessus — contraste toujours vérifié AA.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
