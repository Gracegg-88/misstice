// Types partagés du dashboard — SANS aucune dépendance serveur, pour être
// importables aussi bien côté serveur que dans les composants client.

export type ChecklistTask = {
  id: string;
  event_id: string;
  label: string;
  assignee: string | null;
  due_date: string | null;
  done: boolean;
  position: number;
};

export type Guest = {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  diet: string | null;
  group_label: string | null;
  status: "invité" | "en attente" | "confirmé" | "décliné";
  plus_one: boolean;
};

export type EventVendor = {
  id: string;
  event_id: string;
  vendor_id: string | null;
  name: string;
  category: string | null;
  // Statut = agrégat des devis (annuaire) ou saisi à la main (hors annuaire).
  status: "confirmé" | "en attente" | "refusé";
  price: number | null;
  // Image de la fiche annuaire liée (si prestataire de l'annuaire).
  image: string | null;
};

// Devis REÇU par un particulier (envoyé par un prestataire dans une conversation).
export type ReceivedQuote = {
  id: string;
  conversation_id: string | null;
  presta_name: string | null;
  presta_category: string | null;
  amount: number;
  status: "envoyé" | "accepté" | "refusé" | "expiré";
  quote_number: string | null;
  created_at: string;
};

export type PlanningMoment = {
  id: string;
  event_id: string;
  start_time: string | null;
  duration: string | null;
  title: string;
  description: string | null;
  place: string | null;
  who: string | null;
  vendor: string | null;
  color: string;
  position: number;
};

export type VendorCall = {
  id: string;
  event_id: string;
  vendor: string;
  scheduled_at: string;
  mode: "appel" | "visio";
};

export type InspirationIdea = {
  id: string;
  event_id: string;
  title: string | null;
  category: string | null;
  tags: string[];
  image_url: string;
  source: string | null;
  source_url: string | null;
  liked: boolean;
  media_type: "image" | "video";
};

export type TeamMember = {
  id: string;
  event_id: string;
  email: string;
  role: string | null;
  permissions: string[];
  user_id: string | null;
  status: "invited" | "accepted";
};
