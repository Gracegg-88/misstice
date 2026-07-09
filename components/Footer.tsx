import Logo from "@/components/Logo";

const columns = [
  {
    title: "Produit",
    links: [
      { label: "Créer un événement", href: "/creer" },
      { label: "Explorer les prestataires", href: "/prestataires" },
      { label: "Comment ça marche", href: "/#comment-ca-marche" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Prestataires",
    links: [
      { label: "Devenir prestataire", href: "/creer?type=pro" },
      { label: "Espace pro", href: "/pro" },
      { label: "Connexion", href: "/auth" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto max-w-content px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marque */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate">
              On transforme le stress de l&apos;organisation en plaisir. Pour
              les familles francophones, ici et ailleurs.
            </p>
          </div>

          {/* Colonnes de liens (uniquement des pages réelles) */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-plum">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate transition-colors hover:text-violet"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bas de footer */}
        <div className="mt-12 border-t border-black/5 pt-8">
          <p className="text-sm text-slate">
            © {new Date().getFullYear()} Misstice. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
