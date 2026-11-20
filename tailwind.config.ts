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
        // Lavande : fonds doux et badges, un cran plus présent que violet-soft
        // quand on veut un fond teinté qui reste visible sans attirer l'œil
        // comme le violet plein (CTA).
        lavender: {
          DEFAULT: "#A98BF0",
          soft: "#EFE9FD",
        },
        // Garnet (anciennement "festif") : alerte, litige, action destructive
        // (supprimer, refuser, annuler) — jamais un accent festif/décoratif,
        // jamais en grand aplat. Rouge grenat plutôt qu'orange : plus
        // cohérent avec un positionnement premium/sérieux.
        garnet: {
          DEFAULT: "#A13B4A",
          soft: "#F6E7E9",
        },
        // Validation / succès
        emerald: {
          DEFAULT: "#10B981",
          soft: "#E7F8F1",
        },
        // Or (anciennement "navy") : touches premium UNIQUEMENT — badge Pro,
        // filets, petits détails. Toujours avec du texte foncé (plum) dessus,
        // JAMAIS de texte clair : l'or sur fond clair et le texte clair sur
        // fond or échouent tous les deux au contraste (vérifié : ~2:1).
        gold: {
          DEFAULT: "#D9B25F",
          soft: "#F7EFDC",
          // Variante foncée : seule déclinaison de l'or utilisable EN TEXTE sur
          // fond clair (l'or plein échoue au contraste, ~2:1 — voir au-dessus).
          dark: "#7A5C33",
        },
        // Fonds
        cream: "#FAFAF9", // fond clair (jamais blanc pur)
        ink: "#1E1240", // fond sombre des sections "écrin" — améthyste foncé
        // Texte
        plum: "#1E1240", // texte principal, titres — même améthyste que `ink`
        slate: "#6B7280", // texte secondaire
      },
      // Dégradés de marque réutilisables → classes `bg-gradient-*`.
      // Ne jamais créer de dégradé violet → garnet en grand format : le
      // garnet reste réservé aux alertes, jamais un aplat dominant.
      backgroundImage: {
        // Boutons CTA du quotidien, hero discret.
        "gradient-primary": "linear-gradient(135deg, #6C3CE1 0%, #5A2FC4 100%)",
        // Sections premium, mise en avant prestataire, hero principal.
        "gradient-premium": "linear-gradient(135deg, #6C3CE1 0%, #1E1240 100%)",
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
