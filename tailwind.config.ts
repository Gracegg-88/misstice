import type { Config } from "tailwindcss";

/**
 * Design system Misstice
 * Tous les tokens de couleur, typo et rayons sont centralisés ici.
 * On ne met JAMAIS une couleur en dur dans un composant : on utilise ces tokens.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Carnet de Confiance — couleur-action / primaire (CTA, liens importants)
        violet: {
          DEFAULT: "#168B72", // Vert jade lumineux : signature Misstice
          dark: "#0D584A",
          soft: "#D9F3EA",
        },
        festif: {
          DEFAULT: "#9B4DCA", // Violet prune ensoleillé : accent distinctif
          soft: "#F1DDF8",
        },
        emerald: {
          DEFAULT: "#2F9B74", // Succès : vert positif lisible
          soft: "#DDF4E9",
        },
        navy: {
          DEFAULT: "#5A3C75", // Prune profond : accent premium chaud
          soft: "#E9DDF1",
        },
        cream: "#FFF8F2", // Crème claire et chaleureuse
        ink: "#17352E", // Encre verte profonde
        plum: "#273B36", // Texte principal contrasté
        slate: "#5B746E", // Texte secondaire équilibré

      },
      // Dégradés de marque réutilisables → classes `bg-gradient-*`.
      // Ne jamais créer de dégradé violet → festif en grand format : l'orange
      // reste une touche ponctuelle (~10% max d'une section visible), jamais
      // un aplat dominant.
      backgroundImage: {
        // Boutons CTA du quotidien, hero discret.
        "gradient-primary": "linear-gradient(135deg, #168B72 0%, #0D584A 100%)",
        // Sections premium, mise en avant prestataire, hero principal.
        "gradient-premium": "linear-gradient(135deg, #9B4DCA 0%, #5A3C75 100%)",
        // Fonds de section doux, transitions.
        "gradient-soft": "linear-gradient(135deg, #F1DDF8 0%, #FFF8F2 100%)",
      },
      fontFamily: {
        // Titres éditoriaux (l'émotion)
        display: ["var(--font-display)", "Georgia", "serif"],
        // Corps de texte ultra-lisible (la machine)
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        // Repères, catégories et métadonnées — usage ponctuel pour donner du rythme.
        label: ["var(--font-label)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      maxWidth: {
        content: "1200px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
