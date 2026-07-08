import {
  LayoutGrid,
  Store,
  Inbox,
  MessageSquare,
  CalendarDays,
} from "lucide-react";

// Navigation de l'espace prestataire — source unique (sidebar + menu mobile).
export const PRO_NAV = [
  { label: "Tableau de bord", href: "/pro", icon: LayoutGrid },
  { label: "Mon profil", href: "/pro/profil", icon: Store },
  { label: "Demandes & devis", href: "/pro/demandes", icon: Inbox },
  { label: "Messagerie", href: "/pro/messagerie", icon: MessageSquare },
  { label: "Calendrier", href: "/pro/calendrier", icon: CalendarDays },
];
