import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Style guide",
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
    name: "Lavande",
    token: "lavender",
    hex: "#A98BF0",
    tileClass: "bg-lavender",
    labelClass: "text-plum",
    usage: "Fond doux plus présent que violet-soft — jamais en texte (échoue au contraste, voir plus bas)",
    contrastNote: "Texte plum dessus : AAA ✓ · comme texte sur fond clair : 2.32:1 — échoue, ne pas utiliser",
  },
  {
    name: "Lavande soft",
    token: "lavender-soft",
    hex: "#EFE9FD",
    tileClass: "bg-lavender-soft",
    labelClass: "text-plum",
    usage: "Fond très léger pour badges",
    contrastNote: "Texte plum : 14.60:1 — AAA ✓",
  },
  {
    name: "Or",
    token: "gold",
    hex: "#D9B25F",
    tileClass: "bg-gold",
    labelClass: "text-plum",
    usage: "Touches premium UNIQUEMENT (filets, badge Pro, petits détails) — jamais en grand aplat, jamais en texte",
    contrastNote: "Texte plum dessus : 8.62:1 — AA ✓ · texte clair (cream/blanc) : ~2:1 — échoue, ne pas utiliser",
  },
  {
    name: "Or soft",
    token: "gold-soft",
    hex: "#F7EFDC",
    tileClass: "bg-gold-soft",
    labelClass: "text-plum",
    usage: "Fond léger pour badges \"Premium\" / \"Pro\"",
    contrastNote: "Texte plum : 15.08:1 — AAA ✓",
  },
  {
    name: "Or foncé",
    token: "gold-dark",
    hex: "#7A5C33",
    tileClass: "bg-gold-dark",
    labelClass: "text-cream",
    usage: "Seule déclinaison de l'or utilisable EN TEXTE sur fond clair (liens \"confiance\", icônes)",
    contrastNote: "Texte cream : AA ✓ · en texte sur cream : 5.90:1 — AA ✓",
  },
  {
    name: "Garnet",
    token: "garnet",
    hex: "#A13B4A",
    tileClass: "bg-garnet",
    labelClass: "text-cream",
    usage: "Alerte, litige, action destructive (supprimer, refuser, annuler) — jamais un accent décoratif, jamais en grand aplat",
    contrastNote: "Texte cream/blanc : 6.48:1 — AA ✓ · en texte sur cream : 6.21:1 — AA ✓",
  },
  {
    name: "Garnet soft",
    token: "garnet-soft",
    hex: "#F6E7E9",
    tileClass: "bg-garnet-soft",
    labelClass: "text-plum",
    usage: "Badges d'alerte, lignes en litige",
    contrastNote: "Texte plum : 14.42:1 — AAA ✓",
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
    name: "Cream",
    token: "cream",
    hex: "#FAFAF9",
    tileClass: "bg-cream",
    labelClass: "text-plum",
    usage: "Fond principal — jamais blanc pur (#FFFFFF)",
    contrastNote: "Texte plum : 16.54:1 — AAA ✓",
  },
  {
    name: "Ink",
    token: "ink",
    hex: "#1E1240",
    tileClass: "bg-ink",
    labelClass: "text-cream",
    usage: "Sections sombres / \"écrin\" — améthyste foncé, jamais noir pur (#000000)",
    contrastNote: "Texte cream : 16.54:1 — AAA ✓",
  },
  {
    name: "Plum",
    token: "plum",
    hex: "#1E1240",
    tileClass: "bg-plum",
    labelClass: "text-cream",
    usage: "Texte principal, titres — même améthyste que `ink`",
    contrastNote: "Sur cream : 16.54:1 — AAA ✓",
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
    stops: "violet → ink (améthyste), 135°",
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
        <p className="font-mono text-xs text-violet">{s.token}</p>
        <p className="text-sm text-plum">{s.usage}</p>
        <p className="text-xs text-slate">{s.contrastNote}</p>
      </div>
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <main className="min-h-screen bg-cream pb-24">
      <div className="mx-auto max-w-content px-page py-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-violet">
          Interne — non indexé
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
          Style guide — Palette Misstice
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate">
          Positionnement premium, adulte et sérieux : améthyste foncé, violet,
          lavande et or, sans orange festif. Toutes les valeurs ci-dessous
          vivent dans{" "}
          <code className="rounded bg-violet-soft px-1.5 py-0.5 text-violet">tailwind.config.ts</code> —
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
            Aucun dégradé violet → or/garnet en grand format : ce sont des
            touches ponctuelles, jamais un aplat dominant.
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
            <button className="rounded-2xl bg-gradient-premium px-6 py-3 text-sm font-semibold text-cream shadow-lg shadow-ink/20">
              Prestataire premium
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-3 py-1.5 text-xs font-semibold text-plum">
              ● Vérifié
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-xs font-semibold text-plum">
              ★ Pack Pro
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-garnet-soft px-3 py-1.5 text-xs font-semibold text-garnet">
              ✦ En litige
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
