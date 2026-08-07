import { LayoutDashboard } from "lucide-react";

// Emplacement réservé pour une vraie capture d'écran, à intégrer manuellement
// plus tard (voir le type passé en prop pour savoir laquelle).
export default function ScreenshotDashboard({ type }: { type: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[90%] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-white/60 px-6 py-10 text-center sm:max-w-[560px]">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-soft text-violet">
        <LayoutDashboard size={20} strokeWidth={1.75} />
      </span>
      <p className="text-sm font-medium text-slate">
        Capture d&apos;écran à venir ({type})
      </p>
    </div>
  );
}
