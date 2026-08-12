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
          DEFAULT: "#2E6953", // Vert eucalyptus : signature naturelle et mature
          dark: "#194638",
          soft: "#DDEFE5",
        },
        festif: {
          DEFAULT: "#D9A566", // Champagne poudré : lumière élégante
          soft: "#F5E8D0",
        },
        emerald: {
          DEFAULT: "#438768", // Succès : vert positif et lisible
          soft: "#E4F1EA",
        },
        navy: {
          DEFAULT: "#C96A45", // Abricot fête : accent humain et festif
          soft: "#FBE3D6",
        },
        cream: "#FAF7F1", // Crème chaude
        ink: "#19352B", // Encre eucalyptus profonde
        plum: "#233F35", // Texte principal naturel et contrasté
        slate: "#657B70", // Texte secondaire vert-grisé

      },
      // Dégradés de marque réutilisables → classes `bg-gradient-*`.
      // Ne jamais créer de dégradé violet → festif en grand format : l'orange
      // reste une touche ponctuelle (~10% max d'une section visible), jamais
      // un aplat dominant.
      backgroundImage: {
        // Boutons CTA du quotidien, hero discret.
        "gradient-primary": "linear-gradient(135deg, #2E6953 0%, #194638 100%)",
        // Sections premium, mise en avant prestataire, hero principal.
        "gradient-premium": "linear-gradient(135deg, #2E6953 0%, #C96A45 100%)",
        // Fonds de section doux, transitions.
        "gradient-soft": "linear-gradient(135deg, #F5E8D0 0%, #FAF7F1 100%)",
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
