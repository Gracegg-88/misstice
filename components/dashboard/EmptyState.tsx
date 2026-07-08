import Link from "next/link";
import { PartyPopper } from "lucide-react";

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-soft text-violet">
        <PartyPopper size={26} />
      </div>
      <h1 className="mt-5 font-display text-2xl font-semibold text-plum">
        Aucun événement
      </h1>
      <p className="mt-2 text-slate">{message}</p>
      <Link
        href="/dashboard/nouveau"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
      >
        <PartyPopper size={17} />
        Créer un événement
      </Link>
    </div>
  );
}
