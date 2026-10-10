import GuideFaq from "@/components/guide/GuideFaq";
import { lieuTypeLabel, paragraphs, type CityEventContentFile, type ImageVille, type Lieu } from "@/lib/city-content";

/**
 * Sections éditoriales d'une page ville × événement. Chaque section n'est
 * rendue que si son champ est rempli dans content/villes/<ville>/<evenement>.json :
 * jamais de titre orphelin, jamais de texte de remplacement.
 */

function Prose({ text }: { text: string | undefined }) {
  return (
    <>
      {paragraphs(text).map((p, i) => (
        <p key={i} className="mt-3 max-w-3xl leading-relaxed text-slate first:mt-0">
          {p}
        </p>
      ))}
    </>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-28">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-plum">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Photo de la fiche ville, avec crédit éventuel en légende. */
export function CityPhoto({
  image,
  className = "mt-6",
  eager = false,
}: {
  image: ImageVille;
  className?: string;
  /** true pour la photo en haut de page (chargée tout de suite). */
  eager?: boolean;
}) {
  return (
    <figure className={`${className} overflow-hidden rounded-3xl`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.fichier}
        alt={image.alt}
        width={image.largeur}
        height={image.hauteur}
        loading={eager ? "eager" : "lazy"}
        className="h-64 w-full rounded-3xl object-cover sm:h-96"
      />
      {image.credit?.trim() && (
        <figcaption className="mt-2 text-xs text-slate">{image.credit}</figcaption>
      )}
    </figure>
  );
}

function LieuCard({ lieu }: { lieu: Lieu }) {
  const meta = [lieuTypeLabel(lieu.type), lieu.quartier].filter(Boolean).join(" · ");
  return (
    <article className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-plum">{lieu.nom}</h3>
      {meta && <p className="mt-1 text-sm text-slate">{meta}</p>}
      {(lieu.capacite || lieu.fourchette_prix) && (
        <p className="mt-3 text-sm text-plum">
          {lieu.capacite && <>Capacité : {lieu.capacite}</>}
          {lieu.capacite && lieu.fourchette_prix && " · "}
          {lieu.fourchette_prix && <>Prix : {lieu.fourchette_prix}</>}
        </p>
      )}
      {lieu.convient_a && (
        <p className="mt-3 text-sm leading-relaxed text-slate">
          <span className="font-semibold text-plum">Idéal pour : </span>
          {lieu.convient_a}
        </p>
      )}
      {lieu.conseil && (
        <p className="mt-4 rounded-2xl bg-violet-soft px-4 py-3 text-sm leading-relaxed text-plum">
          <span className="font-semibold">Notre conseil : </span>
          {lieu.conseil}
        </p>
      )}
    </article>
  );
}

export default function CityEventSections({
  content,
  cityName,
  eventLabel,
}: {
  content: CityEventContentFile;
  cityName: string;
  /** Ex. « une baby shower ». */
  eventLabel: string;
}) {
  const lieux = content.lieux ?? [];
  const faq = content.faq_locale ?? [];
  return (
    <>
      {content.saison_et_meteo?.trim() && (
        <Section id="saison" title={`Quelle saison choisir à ${cityName}`}>
          <Prose text={content.saison_et_meteo} />
          {content.images?.[1] && <CityPhoto image={content.images[1]} />}
        </Section>
      )}

      {lieux.length > 0 && (
        <Section id="lieux" title={`Où organiser ${eventLabel} à ${cityName}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            {lieux.map((l) => (
              <LieuCard key={l.nom} lieu={l} />
            ))}
          </div>
        </Section>
      )}

      {content.budget_local?.trim() && (
        <Section id="budget" title={`Quel budget prévoir à ${cityName}`}>
          <Prose text={content.budget_local} />
        </Section>
      )}

      {content.contraintes_pratiques?.trim() && (
        <Section id="pratique" title="Les aspects pratiques à anticiper">
          <Prose text={content.contraintes_pratiques} />
        </Section>
      )}

      {content.specialites_locales?.trim() && (
        <Section id="specialites" title={`Les spécialités de ${cityName} à mettre à l'honneur`}>
          <Prose text={content.specialites_locales} />
        </Section>
      )}

      {faq.length > 0 && (
        <Section id="faq" title="Questions fréquentes">
          <GuideFaq items={faq.map((f) => ({ q: f.question, a: f.reponse }))} />
        </Section>
      )}
    </>
  );
}

/** Sources et date de mise à jour, en pied de contenu. */
export function CityEventSources({ content }: { content: CityEventContentFile }) {
  const sources = content.sources ?? [];
  if (!sources.length && !content.derniere_mise_a_jour?.trim()) return null;
  return (
    <div className="mt-12 border-t border-black/5 pt-6 text-xs leading-relaxed text-slate">
      {content.derniere_mise_a_jour?.trim() && (
        <p>Dernière mise à jour : {formatDate(content.derniere_mise_a_jour)}</p>
      )}
      {sources.length > 0 && (
        <>
          <p className="mt-2 font-semibold text-plum">Sources consultées</p>
          <ul className="mt-1 space-y-1">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-violet">
                  {s.titre?.trim() || s.url}
                </a>
                {s.consulte_le && <> (consulté le {formatDate(s.consulte_le)})</>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
