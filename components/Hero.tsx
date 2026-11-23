/**
 * Hero accueil — nouveau style du site (Complément 2, révisé) : fond
 * améthyste plein, titre énorme avec un mot mis en valeur. Ordinateur :
 * colonnes photo de part et d'autre du titre, qui défilent lentement.
 * Mobile : bande de cartes en éventail sous le titre (glisse au doigt).
 */
import { ArrowDownRight, CheckCircle2, Users } from "lucide-react";
import FanCards from "@/components/FanCards";
import HeroSideColumn from "@/components/HeroSideColumn";
import Reveal from "@/components/Reveal";

const LEFT_IMAGES = ["/wedding-crowd.jpg", "/traiteur.png", "/salle.png"];
const RIGHT_IMAGES = ["/dj.png", "/photographe.png", "/decoration.png"];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink py-16 sm:py-20 lg:py-24">
      {/* La hauteur des colonnes photo est fixée sur elles-mêmes (jamais sur
          la grille) : si le texte est plus court qu'elles, la ligne grandit
          pour les accueillir sans jamais rogner le titre. */}
      <div className="relative mx-auto grid max-w-content items-stretch gap-6 px-page lg:grid-cols-[1fr_minmax(0,2fr)_1fr]">
        <div className="hidden lg:block lg:h-[720px]">
          <HeroSideColumn images={LEFT_IMAGES} direction="up" />
        </div>

        <div className="flex flex-col justify-center text-center">
          <Reveal>
            <p className="eyebrow text-lavender">
              Les moments qui comptent, bien entourés
            </p>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="mx-auto mt-4 max-w-3xl font-hero text-hero font-bold text-cream">
              Votre fête commence par une{" "}
              <span className="inline-block rounded-2xl bg-gold px-3 py-0.5 text-ink">
                décision
              </span>{" "}
              simple.
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-cream/80 sm:text-[17px]">
              Misstice réunit votre projet, vos proches et des prestataires
              vérifiés pour comparer les devis et préparer chaque moment à
              votre rythme.
            </p>
          </Reveal>
          <Reveal delay={180} variant="scale">
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="/creer"
                className="ev-cta inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-violet px-7 py-3.5 text-base font-semibold text-white"
              >
                Créer mon événement <ArrowDownRight size={19} />
              </a>
              <a
                href="/creer?type=pro"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-cream/20 px-7 py-3.5 text-base font-semibold text-cream transition-colors hover:bg-cream/10"
              >
                Je suis prestataire <Users size={18} />
              </a>
            </div>
          </Reveal>

          <div className="relative mt-9 lg:hidden">
            <FanCards />
          </div>

          <div className="relative mx-auto mt-9 flex max-w-content flex-wrap justify-center gap-x-6 gap-y-2 text-center text-sm text-cream/80">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} className="text-gold" /> Devis gratuit,
              sans engagement.
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} className="text-gold" /> Coordonnées
              protégées jusqu&apos;à votre accord.
            </span>
          </div>
        </div>

        <div className="hidden lg:block lg:h-[720px]">
          <HeroSideColumn images={RIGHT_IMAGES} direction="down" />
        </div>
      </div>
    </section>
  );
}
