"use client";

import { getTheme } from "@/lib/themes";
import type { CoverShape, CoverGradient } from "@/lib/cover-options";
import CoverBanner from "@/components/explorer/CoverBanner";
import ProPreviewWatermark from "@/components/pro/ProPreviewWatermark";

/**
 * Aperçu mobile de l'onglet « Ma page » (Complément 4) : un cadre de
 * téléphone, mis à jour en direct pendant la saisie. Le filigrane
 * "Aperçu Pack Pro" s'affiche quand la couverture testée (forme/dégradé)
 * n'est pas encore acquise — pas de capture exploitable d'une option non
 * payée.
 */
export default function MobilePreview({
  company,
  themeId,
  mainImage,
  coverIsIllustration,
  illustrationUrl,
  shape,
  gradient,
  hasAccess,
}: {
  company: string;
  themeId: string;
  mainImage: string | null;
  coverIsIllustration: boolean;
  illustrationUrl: string | null;
  shape: CoverShape;
  gradient: CoverGradient;
  hasAccess: boolean;
}) {
  const theme = getTheme(themeId);
  const coverUrl = coverIsIllustration ? illustrationUrl : mainImage;
  const previewingUnownedPro =
    !hasAccess && (shape !== "droite" || gradient !== "aucun");

  return (
    <div className="sticky top-6">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate">
        Aperçu mobile
      </p>
      <div className="relative mx-auto w-[260px] overflow-hidden rounded-[32px] border-[6px] border-plum bg-[var(--v-ground)] shadow-lg">
        <div
          className="relative"
          style={
            {
              "--v-ground": theme.colors.ground,
              "--v-text": theme.colors.text,
              "--v-heading": theme.colors.heading,
              "--v-muted": theme.colors.muted,
              "--v-surface": theme.colors.surface,
              "--v-surface-text": theme.colors.surfaceText,
              "--v-button-bg": theme.colors.buttonBg,
              "--v-button-text": theme.colors.buttonText,
            } as React.CSSProperties
          }
        >
          <CoverBanner
            imageUrl={coverUrl}
            isIllustration={coverIsIllustration}
            shape={shape}
            gradient={gradient}
            groundColor={theme.colors.ground}
            heightClassName="h-24"
          />
          <ProPreviewWatermark active={previewingUnownedPro} />
          <div className="relative px-4 pb-6 pt-2">
            <div className="-mt-8 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--v-ground)] bg-[var(--v-surface)] font-display text-lg font-semibold text-[var(--v-heading)] shadow-sm">
              {(company.trim()[0] || "P").toUpperCase()}
            </div>
            <p className="mt-2 truncate font-display text-base font-semibold text-[var(--v-heading)]">
              {company.trim() || "Votre activité"}
            </p>
            <div className="mt-4 h-9 rounded-xl bg-[var(--v-button-bg)]" />
            <div className="mt-2 h-9 rounded-xl border border-[var(--v-text)]/15" />
          </div>
        </div>
      </div>
    </div>
  );
}
