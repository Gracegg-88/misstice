import Link from "next/link";
import { MessagesSquare, Store } from "lucide-react";

// Panneau de droite quand aucune conversation n'est ouverte (desktop).
export default function ProMessagerieEmpty() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-black/5 bg-white p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-soft text-violet">
        <MessagesSquare size={26} />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold text-plum">
        Messagerie
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate">
        Sélectionnez une conversation à gauche. Les familles vous contactent
        depuis votre fiche publique — plus elle est complète, plus vous recevez
        de demandes.
      </p>
      <Link
        href="/pro/profil"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
      >
        <Store size={17} />
        Compléter ma fiche
      </Link>
    </div>
  );
}
