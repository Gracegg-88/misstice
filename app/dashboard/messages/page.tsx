import Link from "next/link";
import { MessagesSquare, Store, ArrowRight } from "lucide-react";

// Panneau de droite quand aucune conversation n'est ouverte (desktop).
export default function MessagesEmpty() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-black/5 bg-white p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-soft text-violet">
        <MessagesSquare size={26} />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold text-plum">
        Vos messages
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate">
        Sélectionnez une conversation à gauche, ou trouvez un prestataire et
        demandez-lui un devis pour démarrer un échange.
      </p>
      <Link
        href="/prestataires"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
      >
        <Store size={17} />
        Trouver un prestataire &amp; demander un devis
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
