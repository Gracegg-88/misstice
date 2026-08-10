import { ChevronDown } from "lucide-react";
import Reveal from "./Reveal";

// Réduit aux 3 questions essentielles pour le lancement (gratuit, sécurité,
// comment ça marche) — celles qui supposent un usage déjà établi (organiser
// à plusieurs, autre événement qu'un mariage) sont retirées pour l'instant.
const faqs = [
  {
    q: "Misstice, c'est vraiment gratuit ?",
    a: "Oui. Créer un compte et organiser votre événement (budget, invités, checklist, équipe) est entièrement gratuit. Vous ne payez que les prestataires que vous choisissez de réserver.",
  },
  {
    q: "Comment se passe la mise en relation avec les prestataires ?",
    a: "Vous découvrez les prestataires sur la carte, échangez avec eux et recevez leurs devis directement dans Misstice. Tout reste centralisé, sans quitter la plateforme.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Vos informations sont hébergées en Europe et protégées : seuls vous et les personnes que vous invitez accédez à votre événement.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-8 sm:py-10">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl">
          <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
            Questions fréquentes
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-black/5 bg-white p-5 shadow-sm [&_svg]:open:rotate-180"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-plum marker:hidden">
                  {f.q}
                  <ChevronDown
                    size={20}
                    className="shrink-0 text-violet transition-transform"
                  />
                </summary>
                <p className="mt-3 leading-relaxed text-slate">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
