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
        // Couleur principale unique : boutons, liens, élément actif.
        violet: {
          DEFAULT: "#6C3CE1",
          dark: "#5A2FC4",
          soft: "#F1ECFD", // fond léger pour badges / surfaces
        },
        // Accent festif : UN seul usage ponctuel par écran (ex. badge du hero).
        // Jamais sur les titres, liens, icônes ou soulignements — c'est le rôle du violet.
        festif: {
          DEFAULT: "#FF8C42",
          soft: "#FFF1E6",
        },
        // Validation / succès
        emerald: {
          DEFAULT: "#10B981",
          soft: "#E7F8F1",
        },
        // Accent premium neutre (mise en avant prestataire, badges "premium").
        // Volontairement froid/neutre — jamais de rose/blush/terracotta, pour
        // rester perçu comme une marketplace neutre en genre, pas "réservée
        // aux femmes". Réservé aux touches premium, jamais en usage principal.
        navy: {
          DEFAULT: "#2B4C7E",
          soft: "#EAF0F8",
        },
        // Fonds
        cream: "#FAFAF9", // fond clair (jamais blanc pur)
        ink: "#1E1B2E", // fond sombre des sections "écrin"
        // Texte
        plum: "#1A1A2E", // texte principal
        slate: "#6B7280", // texte secondaire
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
        // Titres éditoriaux (l'émotion) — `font-heading`, `font-display` gardé
        // comme alias historique.
        heading: ["var(--font-heading)", "Georgia", "serif"],
        display: ["var(--font-heading)", "Georgia", "serif"],
        // Corps de texte, menu, boutons, libellés (la machine)
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      // Échelle éditoriale fluide (s'adapte seule au mobile via clamp()).
      // Minimum absolu du site : 12px (text-xs) — jamais en dessous.
      fontSize: {
        hero: ["clamp(2.75rem, 5.5vw, 6rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        h2: ["clamp(2rem, 3.5vw, 3.25rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        h3: ["clamp(1.375rem, 2vw, 1.75rem)", { lineHeight: "1.15" }],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      maxWidth: {
        // Conteneur principal : toujours associé à `px-page`.
        content: "1440px",
      },
      spacing: {
        // Gouttière latérale fluide : 16px sur mobile → 64px sur grand écran.
        page: "clamp(1rem, 4vw, 4rem)",
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
