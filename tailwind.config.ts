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
        // Couleur-action / primaire (CTA, liens importants)
        violet: {
          DEFAULT: "#6C3CE1",
          dark: "#5A2FC4",
          soft: "#F1ECFD", // fond léger pour badges / surfaces
        },
        // Accent festif (réservé aux touches chaleureuses, jamais aux gros aplats)
        festif: {
          DEFAULT: "#FF8C42",
          soft: "#FFF1E6",
        },
        // Validation / succès
        emerald: {
          DEFAULT: "#10B981",
          soft: "#E7F8F1",
        },
        // Fonds
        cream: "#FAFAF9", // fond clair (jamais blanc pur)
        ink: "#1E1B2E", // fond sombre des sections "écrin"
        // Texte
        plum: "#1A1A2E", // texte principal
        slate: "#6B7280", // texte secondaire
      },
      fontFamily: {
        // Titres éditoriaux (l'émotion)
        display: ["var(--font-display)", "Georgia", "serif"],
        // Corps de texte ultra-lisible (la machine)
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
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
