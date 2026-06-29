import Reveal from "./Reveal";

const stats = [
  { value: "12 000+", label: "événements organisés" },
  { value: "3 500+", label: "prestataires vérifiés" },
  { value: "4,9/5", label: "note moyenne des familles" },
  { value: "30 %", label: "de stress en moins (promis)" },
];

export default function TrustBar() {
  return (
    <section className="border-y border-black/5 bg-white">
      <Reveal>
        <div className="mx-auto grid max-w-content grid-cols-2 gap-8 px-5 py-12 sm:px-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-semibold text-violet sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-slate">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
