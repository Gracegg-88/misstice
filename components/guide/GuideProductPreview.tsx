/**
 * Carnet de Confiance — aperçu produit déterministe pour les guides.
 * Remplace les captures d’anciennes interfaces par le langage visuel actuel.
 */
import { Check, CircleDollarSign, UsersRound } from "lucide-react";

export default function GuideProductPreview({ mode = "checklist" }: { mode?: "checklist" | "budget" }) {
  const isBudget = mode === "budget";
  const rows = isBudget
    ? ["Lieu & réception", "Moments à partager", "Marge de sérénité"]
    : ["Poser votre cadre", "Inviter les bonnes personnes", "Comparer vos réponses"];

  return (
    <aside className="my-8 overflow-hidden bg-ink p-5 text-cream sm:p-6" aria-label="Aperçu de l’espace projet Misstice">
      <div className="flex items-center justify-between">
        <span className="font-label text-[10px] uppercase tracking-[0.16em] text-festif">Dans votre projet Misstice</span>
        {isBudget ? <CircleDollarSign size={18} className="text-festif" /> : <UsersRound size={18} className="text-festif" />}
      </div>
      <h3 className="mt-5 max-w-md font-display text-2xl font-semibold leading-[1.02] sm:text-3xl">Une vue claire pour avancer, sans vous éparpiller.</h3>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {rows.map((row, index) => (
          <div key={row} className="bg-cream/10 p-3">
            <span className="font-label text-[10px] tracking-[0.12em] text-festif">0{index + 1}</span>
            <p className="mt-4 text-sm font-medium leading-snug">{row}</p>
            <Check className="mt-4 text-festif" size={16} />
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm font-light leading-relaxed text-cream/75">Ce n’est pas une image de démonstration : ce repère illustre les informations que Misstice rassemble dans le même projet.</p>
    </aside>
  );
}
