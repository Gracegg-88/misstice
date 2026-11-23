"use client";

import {
  COVER_SHAPES,
  COVER_GRADIENTS,
  type CoverShape,
  type CoverGradient,
} from "@/lib/cover-options";
import ProLockBadge from "@/components/pro/ProLockBadge";

/**
 * Choix de la couverture (Complément 3) : photo (la sienne ou une photo
 * d'illustration de la catégorie, voir app/admin/photos-illustration) + forme
 * du bas + dégradé. Les options non gratuites restent cliquables même sans
 * les droits Pack Pro ("essayer" — voir Complément 3) : c'est
 * ProfilClient.tsx qui intercepte l'enregistrement et affiche la fenêtre
 * Pack Pro (PackProModal) si besoin.
 */
export default function CoverPicker({
  hasAccess,
  mainImage,
  categoryPhotos,
  coverIsIllustration,
  illustrationUrl,
  shape,
  gradient,
  onChangeCoverSource,
  onChangeShape,
  onChangeGradient,
}: {
  hasAccess: boolean;
  mainImage: string | null;
  categoryPhotos: { id: string; url: string }[];
  coverIsIllustration: boolean;
  illustrationUrl: string | null;
  shape: CoverShape;
  gradient: CoverGradient;
  onChangeCoverSource: (isIllustration: boolean, url: string | null) => void;
  onChangeShape: (s: CoverShape) => void;
  onChangeGradient: (g: CoverGradient) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-plum">Photo de couverture</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!mainImage}
            onClick={() => onChangeCoverSource(false, null)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              !coverIsIllustration
                ? "bg-violet text-white"
                : "bg-cream text-slate hover:text-plum"
            }`}
          >
            Ma photo
          </button>
          <button
            type="button"
            disabled={categoryPhotos.length === 0}
            onClick={() =>
              onChangeCoverSource(true, illustrationUrl ?? categoryPhotos[0]?.url ?? null)
            }
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              coverIsIllustration
                ? "bg-violet text-white"
                : "bg-cream text-slate hover:text-plum"
            }`}
          >
            Photo d&apos;illustration
          </button>
        </div>
        {!mainImage && categoryPhotos.length === 0 && (
          <p className="mt-1.5 text-xs text-slate">
            Ajoutez une photo principale, ou patientez que Misstice ajoute des
            photos d&apos;illustration pour votre catégorie.
          </p>
        )}
        {coverIsIllustration && categoryPhotos.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {categoryPhotos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChangeCoverSource(true, p.url)}
                aria-label="Choisir cette photo"
                className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                  illustrationUrl === p.url
                    ? "border-violet"
                    : "border-transparent hover:border-violet/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-plum">Forme du bas de la couverture</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COVER_SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChangeShape(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                shape === s.id
                  ? "bg-violet text-white"
                  : "bg-cream text-slate hover:text-plum"
              }`}
            >
              {s.label}
              {!s.free && !hasAccess && <ProLockBadge size="xs" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-plum">Dégradé sur la couverture</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COVER_GRADIENTS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onChangeGradient(g.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                gradient === g.id
                  ? "bg-violet text-white"
                  : "bg-cream text-slate hover:text-plum"
              }`}
            >
              {g.label}
              {!g.free && !hasAccess && <ProLockBadge size="xs" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
