// Balises du Places UI Kit (Maps JavaScript API), utilisées par
// components/google/GooglePlaceCard.tsx.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type GmpElement = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  [attr: string]: unknown;
};

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "gmp-place-details-compact": GmpElement;
      "gmp-place-details-place-request": GmpElement;
      "gmp-place-name": GmpElement;
      "gmp-place-address": GmpElement;
      "gmp-place-rating": GmpElement;
      "gmp-place-type": GmpElement;
      "gmp-place-attribution": GmpElement;
    }
  }
}
