/**
 * Section chiffres réels (Complément 2, "sections numérotées 01/04") —
 * uniquement des chiffres tirés de la base, jamais inventés.
 */
import { getPlatformStats } from "@/lib/vendors";
import Reveal from "@/components/Reveal";

export default async function Stats() {
  const stats = await getPlatformStats();
  const items = [
    { n: "01", value: `${stats.categories}+`, label: "catégories de métiers accompagnées" },
    { n: "02", value: `${stats.cities}`, label: stats.cities > 1 ? "villes déjà représentées" : "ville déjà représentée" },
    { n: "03", value: `${stats.avgResponseHours}h`, label: "délai de réponse moyen des prestataires" },
    { n: "04", value: `${stats.verifiedVendors}`, label: "prestataires vérifiés (SIRET contrôlé)" },
  ];

  return (
    <section className="bg-cream py-14 sm:py-16">
      <div className="mx-auto max-w-content px-page">
        <Reveal className="text-center">
          <p className="eyebrow text-violet">Misstice en phase de lancement</p>
          <h2 className="mt-2 font-display text-h2 font-medium text-plum">
            Des chiffres réels, dès aujourd&apos;hui
          </h2>
        </Reveal>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.n} delay={i * 90}>
              <div className="h-full rounded-3xl border border-black/5 bg-white p-6">
                <p className="text-xs font-semibold tracking-[0.15em] text-violet">
                  {it.n} / 04
                </p>
                <p className="mt-3 font-hero text-4xl font-bold text-plum sm:text-5xl">
                  {it.value}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{it.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
