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
          DEFAULT: "#0F766E", // Vert émeraude / teal ultra-lumineux et peps
          dark: "#115E59",
          soft: "#CCFBF1",
        },
        festif: {
          DEFAULT: "#F97316", // Orange corail éclatant / peps
          soft: "#FFEDD5",
        },
        emerald: {
          DEFAULT: "#059669",
          soft: "#D1FAE5",
        },
        navy: {
          DEFAULT: "#0D9488",
          soft: "#CCFBF1",
        },
        cream: "#FAF5EF", // Fond ivoire clair très chaleureux et lumineux
        ink: "#0F2922", // Fond sombre profond et élégant
        plum: "#133830", // Texte principal sombre et contrasté
        slate: "#4A6B5D", // Texte secondaire lisible et équilibré

      },
      // Dégradés de marque réutilisables → classes `bg-gradient-*`.
      // Ne jamais créer de dégradé violet → festif en grand format : l'orange
      // reste une touche ponctuelle (~10% max d'une section visible), jamais
      // un aplat dominant.
      backgroundImage: {
        // Boutons CTA du quotidien, hero discret.
        "gradient-primary": "linear-gradient(135deg, #6C3CE1 0%, #5A2FC4 100%)",
        // Sections premium, mise en avant prestataire, hero principal.
        "gradient-premium": "linear-gradient(135deg, #6C3CE1 0%, #2B4C7E 100%)",
        // Fonds de section doux, transitions.
        "gradient-soft": "linear-gradient(135deg, #F1ECFD 0%, #FAFAF9 100%)",
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
