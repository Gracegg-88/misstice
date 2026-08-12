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
          DEFAULT: "#C85A32", // Terracotta Fête : primaire chaleureux et distinctif
          dark: "#9F4528",
          soft: "#FCE8DE",
        },
        festif: {
          DEFAULT: "#D4A373", // Sable doré : accent solaire et élégant
          soft: "#F3E6D2",
        },
        emerald: {
          DEFAULT: "#3F8066", // Succès : vert sauge discret, réservé aux états positifs
          soft: "#E6F1EB",
        },
        navy: {
          DEFAULT: "#7B5143", // Brun cacao : accent premium chaud
          soft: "#F0E2DB",
        },
        cream: "#FAF7F2", // Lin blanc / crème poudrée
        ink: "#2B1E1A", // Encre brune profonde
        plum: "#3A2923", // Texte principal chaud et contrasté
        slate: "#755F56", // Texte secondaire brun-grisé

      },
      // Dégradés de marque réutilisables → classes `bg-gradient-*`.
      // Ne jamais créer de dégradé violet → festif en grand format : l'orange
      // reste une touche ponctuelle (~10% max d'une section visible), jamais
      // un aplat dominant.
      backgroundImage: {
        // Boutons CTA du quotidien, hero discret.
        "gradient-primary": "linear-gradient(135deg, #C85A32 0%, #9F4528 100%)",
        // Sections premium, mise en avant prestataire, hero principal.
        "gradient-premium": "linear-gradient(135deg, #C85A32 0%, #7B5143 100%)",
        // Fonds de section doux, transitions.
        "gradient-soft": "linear-gradient(135deg, #FCE8DE 0%, #FAF7F2 100%)",
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
