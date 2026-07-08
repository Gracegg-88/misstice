import { ChevronDown } from "lucide-react";
import Reveal from "./Reveal";
import ReviewsCard from "./ReviewsCard";

const faqs = [
  {
    q: "Misstice, c'est vraiment gratuit ?",
    a: "Oui. Créer un compte et organiser votre événement (budget, invités, checklist, équipe) est entièrement gratuit. Vous ne payez que les prestataires que vous choisissez de réserver.",
  },
  {
    q: "Puis-je organiser autre chose qu'un mariage ?",
    a: "Bien sûr : anniversaires, baptêmes, galas, baby showers… Misstice s'adapte à tous vos moments importants.",
  },
  {
    q: "Comment se passe la mise en relation avec les prestataires ?",
    a: "Vous découvrez les prestataires sur la carte, échangez avec eux et recevez leurs devis directement dans Misstice. Tout reste centralisé, sans quitter la plateforme.",
  },
  {
    q: "Puis-je organiser à plusieurs avec ma famille ?",
    a: "Oui. Invitez vos proches dans votre espace, répartissez les tâches et suivez l'avancement de chacun en temps réel.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Vos informations sont hébergées en Europe et protégées : seuls vous et les personnes que vous invitez accédez à votre événement.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-14 sm:py-16">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Colonne gauche : questions */}
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
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

          {/* Colonne droite : avis */}
          <Reveal delay={120} className="lg:sticky lg:top-24">
            <ReviewsCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
