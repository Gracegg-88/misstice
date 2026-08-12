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
          DEFAULT: "#162B48", // Bleu nuit saphir : primaire haut de gamme
          dark: "#0E1C31",
          soft: "#E7EEF7",
        },
        festif: {
          DEFAULT: "#D4A373", // Or solaire : accent chaud et festif
          soft: "#F5E8D2",
        },
        emerald: {
          DEFAULT: "#2F8067", // Succès : vert discret et lisible
          soft: "#E2F0EA",
        },
        navy: {
          DEFAULT: "#243D63", // Saphir clair : accent premium
          soft: "#E1E8F2",
        },
        cream: "#FAF9F5", // Lin blanc lumineux
        ink: "#0F1D2E", // Bleu encre profond
        plum: "#1C2E45", // Texte principal bleu ardoise
        slate: "#586A7F", // Texte secondaire bleu-grisé

      },
      // Dégradés de marque réutilisables → classes `bg-gradient-*`.
      // Ne jamais créer de dégradé violet → festif en grand format : l'orange
      // reste une touche ponctuelle (~10% max d'une section visible), jamais
      // un aplat dominant.
      backgroundImage: {
        // Boutons CTA du quotidien, hero discret.
        "gradient-primary": "linear-gradient(135deg, #162B48 0%, #0E1C31 100%)",
        // Sections premium, mise en avant prestataire, hero principal.
        "gradient-premium": "linear-gradient(135deg, #243D63 0%, #0F1D2E 100%)",
        // Fonds de section doux, transitions.
        "gradient-soft": "linear-gradient(135deg, #F5E8D2 0%, #FAF9F5 100%)",
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
