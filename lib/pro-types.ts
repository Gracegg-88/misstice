// Types espace pro — SANS dépendance serveur (importables côté client).

export type ProVendor = {
  profileId: string; // = user id
  vendorId: string | null; // fiche annuaire liée
  company: string;
  category: string | null;
  city: string | null;
  about: string | null;
  tagline: string | null;
  priceFrom: string | null;
  image: string | null;
  verified: boolean;
  rating: number;
  reviews: number;
  // Ambiance & Vibe
  moods: string[];
  energies: string[];
  lights: string[];
  palettes: string[];
  atmospheres: string[];
  music: string[];
};

export type QuoteItem = {
  label: string;
  description: string;
  qty: number;
  unit_price: number;
};

export type Quote = {
  id: string;
  prestataire_id: string;
  conversation_id: string | null;
  client_name: string | null;
  event_label: string | null;
  amount: number;
  status: "envoyé" | "accepté" | "refusé" | "expiré";
  created_at: string;
  // Document de devis
  quote_number: string | null;
  validity_days: number;
  intro_message: string | null;
  event_need: string | null;
  event_date: string | null;
  event_location: string | null;
  guests_count: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  service_fee: number;
  tax_rate: number;
  items: QuoteItem[];
  presta_name: string | null;
  presta_category: string | null;
  presta_email: string | null;
  presta_phone: string | null;
  presta_address: string | null;
};

export type VendorPackage = {
  id: string;
  vendor_id: string;
  name: string;
  price: string | null;
  features: string[];
  popular: boolean;
  position: number;
};

export type VendorPhoto = {
  id: string;
  vendor_id: string;
  url: string;
  position: number;
};

export type Availability = {
  id: string;
  date: string;
  status: "available" | "booked" | "pending" | "blocked";
  note: string | null;
};

export type ProStats = {
  demandes: number; // conversations reçues
  quotesSent: number;
  quotesAccepted: number;
  revenue: number; // somme des devis acceptés
  views: number;
  rating: number;
  reviews: number;
};
