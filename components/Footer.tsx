import { Sparkles } from "lucide-react";

// lucide-react ne fournit plus les logos de marque : on utilise des SVG intégrés.
function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function IconLinkedin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const columns = [
  {
    title: "Produit",
    links: ["Créer un événement", "Explorer les prestataires", "Comment ça marche", "Tarifs"],
  },
  {
    title: "Prestataires",
    links: ["Devenir prestataire", "Espace pro", "Centre d'aide pro", "Témoignages"],
  },
  {
    title: "Misstice",
    links: ["À propos", "Blog & inspiration", "Carrières", "Contact"],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto max-w-content px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Marque + newsletter */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet text-white">
                <Sparkles size={17} />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight">
                Misstice
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate">
              On transforme le stress de l&apos;organisation en plaisir. Pour
              les familles francophones, ici et ailleurs.
            </p>

            <div className="mt-6">
              <p className="text-sm font-semibold text-plum">
                Recevez nos idées de fête
              </p>
              <div className="mt-3 flex max-w-sm gap-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none placeholder:text-slate focus:border-violet"
                />
                <button className="rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark">
                  OK
                </button>
              </div>
            </div>
          </div>

          {/* Colonnes de liens */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-plum">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate transition-colors hover:text-violet"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bas de footer */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-black/5 pt-8 sm:flex-row">
          <p className="text-sm text-slate">
            © {new Date().getFullYear()} Misstice. Fait avec ❤️ pour les familles.
          </p>
          <div className="flex items-center gap-3">
            {[
              { Icon: IconInstagram, label: "Instagram" },
              { Icon: IconFacebook, label: "Facebook" },
              { Icon: IconLinkedin, label: "LinkedIn" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-slate transition-colors hover:bg-violet-soft hover:text-violet"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
