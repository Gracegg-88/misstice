import {
  LayoutGrid,
  Wallet,
  ListChecks,
  Users,
  Store,
  UsersRound,
  CalendarHeart,
  Sparkles,
  MessagesSquare,
} from "lucide-react";

// Navigation de l'espace particulier — source unique (sidebar + menu mobile).
export const DASHBOARD_NAV = [
  { label: "Vue d'ensemble", href: "/dashboard", icon: LayoutGrid },
  { label: "Budget", href: "/dashboard/budget", icon: Wallet },
  { label: "Checklist", href: "/dashboard/checklist", icon: ListChecks },
  { label: "Invités", href: "/dashboard/invites", icon: Users },
  { label: "Prestataires", href: "/dashboard/prestataires", icon: Store },
  { label: "Messages", href: "/dashboard/messages", icon: MessagesSquare },
  { label: "Équipe", href: "/dashboard/equipe", icon: UsersRound },
  { label: "Planning Jour J", href: "/dashboard/planning", icon: CalendarHeart },
  { label: "Inspiration", href: "/dashboard/inspiration", icon: Sparkles },
];
