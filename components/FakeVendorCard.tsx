/**
 * Fausse page de prestataire d'exemple (carrousel circulaire de
 * /devenir-prestataire, Complément 2) : reprend le langage visuel des vraies
 * fiches (bandeau coloré, avatar, nom, catégorie) en miniature, avec des noms
 * et métiers INVENTÉS. Jamais une vraie entreprise.
 */
export type FakeVendor = {
  name: string;
  category: string;
  city: string;
  ground: string;
  accent: string;
  heading: string;
};

export default function FakeVendorCard({ vendor }: { vendor: FakeVendor }) {
  return (
    <div
      className="flex h-44 w-32 flex-col overflow-hidden rounded-[22px] shadow-[0_14px_32px_rgba(30,18,64,0.28)] sm:h-52 sm:w-36"
      style={{ background: vendor.ground }}
    >
      <div className="h-12 shrink-0" style={{ background: vendor.accent }} />
      <div className="flex flex-1 flex-col items-center px-2 pb-3 pt-0 text-center">
        <div
          className="-mt-5 h-9 w-9 shrink-0 rounded-2xl border-2 shadow-sm"
          style={{ background: vendor.ground, borderColor: vendor.ground }}
        />
        <p
          className="mt-1.5 truncate text-[11px] font-semibold leading-tight"
          style={{ color: vendor.heading }}
        >
          {vendor.name}
        </p>
        <p className="mt-0.5 truncate text-[9px]" style={{ color: vendor.heading, opacity: 0.65 }}>
          {vendor.category}
        </p>
        <div className="mt-auto w-full space-y-1 pt-2">
          <div className="h-3.5 w-full rounded-full" style={{ background: vendor.accent }} />
          <div
            className="h-3.5 w-full rounded-full border"
            style={{ borderColor: vendor.heading, opacity: 0.25 }}
          />
        </div>
      </div>
    </div>
  );
}
