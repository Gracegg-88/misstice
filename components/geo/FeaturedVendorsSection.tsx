import { BadgeCheck, CakeSlice, Lock, PartyPopper, Store, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FeaturedVendor } from "@/lib/geo";
import { SITE_URL } from "@/lib/seo";

const ROLE_ICONS: Record<string, LucideIcon> = {
  traiteur: UtensilsCrossed,
  patissier: CakeSlice,
  decorateur: PartyPopper,
};

// Adresse déjà publiée dans les mentions légales.
const CONTACT_EMAIL = "contact@misstice.com";

function removalHref(vendorName: string): string {
  const subject = `Retrait ou rectification de fiche : ${vendorName}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/**
 * Section « 3 prestataires pour réussir votre <événement> à <ville> ».
 * Sélection par critères fixes (voir getFeaturedVendors) : masquée en
 * entier si aucun rôle n'a de prestataire, jamais de carte vide.
 */
export default function FeaturedVendorsSection({
  featured,
  eventName,
  cityName,
}: {
  featured: FeaturedVendor[];
  /** Ex. « baby shower » (sans article). */
  eventName: string;
  cityName: string;
}) {
  if (!featured.length) return null;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${featured.length} prestataires pour réussir votre ${eventName} à ${cityName}`,
    itemListElement: featured.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/prestataires/${f.vendor.id}`,
      name: f.vendor.name,
    })),
  };

  return (
    <section id="prestataires-essentiels" className="mt-14 scroll-mt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <h2 className="font-display text-2xl font-semibold tracking-tight text-plum">
        {featured.length} prestataire{featured.length > 1 ? "s" : ""} pour réussir votre {eventName} à {cityName}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate">
        Un prestataire par rôle essentiel, retenu selon des critères fixes : activité confirmée par
        un numéro SIRET, implantation à {cityName}, puis fiche la plus complète sur Misstice. Les
        fiches ne sont pas forcément vérifiées ni réclamées : le badge de chaque carte l&apos;indique.
        Cette sélection n&apos;est pas sponsorisée : aucun prestataire ne paie pour y figurer.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {featured.map((f) => {
          const Icon = ROLE_ICONS[f.role] ?? Store;
          const verified = f.vendor.verified && !!f.vendor.userId;
          const unclaimed = f.vendor.claimStatus === "non_reclamee";
          return (
            <article key={f.vendor.id} className="flex flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                {f.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.photo} alt={`Réalisation de ${f.vendor.name}`} className="h-14 w-14 rounded-2xl object-cover" />
                ) : (
                  <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-soft text-violet">
                    <Icon size={24} strokeWidth={1.75} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">{f.roleLabel}</p>
                  <h3 className="font-display text-lg font-semibold leading-tight text-plum">{f.vendor.name}</h3>
                  <p className="text-sm text-slate">{cityName}</p>
                </div>
              </div>

              <div className="mt-3">
                {verified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-violet">
                    <BadgeCheck size={14} /> Vérifié
                  </span>
                ) : unclaimed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-festif-soft px-2.5 py-1 text-xs font-medium text-festif">
                    <Lock size={12} /> Fiche non réclamée
                  </span>
                ) : null}
              </div>

              {f.pourquoi.trim() && (
                <p className="mt-4 text-sm leading-relaxed text-plum">{f.pourquoi}</p>
              )}

              {f.services.length > 0 && (
                <p className="mt-3 text-sm leading-relaxed text-slate">
                  <span className="font-semibold text-plum">Services : </span>
                  {f.services.join(", ")}
                </p>
              )}

              <a
                href={`/prestataires/${f.vendor.id}`}
                className="mt-5 text-sm font-semibold text-violet hover:text-violet-dark"
              >
                Voir la fiche de {f.vendor.name}, {f.roleLabel.toLowerCase()} à {cityName}
              </a>

              <div className="mt-auto pt-4 text-xs text-slate">
                {unclaimed && (
                  <p>
                    Vous êtes ce prestataire ?{" "}
                    <a href="/devenir-prestataire" className="font-semibold text-violet hover:text-violet-dark">
                      Réclamez votre fiche
                    </a>
                  </p>
                )}
                <p className="mt-1">
                  <a href={removalHref(f.vendor.name)} className="underline hover:text-violet">
                    Demander le retrait ou la rectification de cette fiche
                  </a>
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
