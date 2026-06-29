import { CalendarClock, Info } from "lucide-react";
import AgendaWidget from "@/components/dashboard/AgendaWidget";

export default function AgendaPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Agenda
      </h1>
      <p className="mt-1 text-sm text-slate">
        Planifiez vos appels et visios avec les prestataires, au même endroit que
        votre événement.
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-violet/15 bg-violet-soft p-4 text-sm text-violet">
        <Info size={18} className="mt-0.5 shrink-0" />
        <span>
          Astuce : chaque appel planifié ici apparaît aussi sur votre Vue
          d&apos;ensemble. Vous pouvez choisir « Appel » ou « Visio ».
        </span>
      </div>

      <div className="mt-6">
        <AgendaWidget />
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-slate">
        <CalendarClock size={16} className="text-violet" />
        Bientôt : synchronisation avec Google Agenda et rappels automatiques.
      </div>
    </div>
  );
}
