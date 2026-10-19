// Détection de coordonnées personnelles dans un texte (sans dépendance React :
// utilisable côté navigateur ET côté serveur). Utilisée par :
// - lib/contact-alert.ts : avertissement (mascotte) dans les messages clients ;
// - le formulaire pro (components/pro/ProfilClient.tsx) : blocage de
//   l'enregistrement si la fiche publique contient des coordonnées ;
// - /admin/prestataires : filtre « Coordonnées détectées ».
//
// ⚠️ La même détection existe côté base, dans
// public.contains_contact_info() (supabase/vendor-contact-guard.sql) :
// toute modification ici doit y être reportée.

const PATTERNS: RegExp[] = [
  // Email, y compris les formes déguisées : « jean (at) gmail point com »
  /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\sarobase\s)\s*[a-z0-9-]+(?:\s*(?:\.|\(dot\)|\[dot\]|\spoint\s)\s*[a-z0-9-]+)*\s*(?:\.|\(dot\)|\[dot\]|\spoint\s)\s*[a-z]{2,}/i,
  // Téléphone français : 06 12 34 56 78, 06.12.34.56.78, +33 6 12 34 56 78
  /(?:(?:\+|00)\s*33\s*\(?0?\)?\s*|\b0)[1-9](?:[\s.-]*\d{2}){4}\b/,
  // Autre numéro international : +44 7911 123456…
  /\+\s*\d{1,3}(?:[\s.-]*\d){8,}/,
  // IBAN (paiement hors plateforme)
  /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b/,
  // Messageries / réseaux / moyens de paiement externes
  /\b(?:whats\s?app|telegram|snap(?:chat)?|insta(?:gram)?|paypal|lydia|iban|rib)\b/i,
  // Adresse de site : http(s)://… ou www.…
  /\bhttps?:\/\/|\bwww\./i,
  // Nom de domaine sans http ni www : monsite.fr, mon-studio.com…
  // Volontairement limité aux extensions courantes : des extensions qui sont
  // aussi des mots (.photo, .art, .pro, .events…) bloqueraient une phrase
  // banale où l'espace après le point a été oublié (« …mariage.Photo… »).
  /\b[a-z0-9-]+\.(?:fr|com|net|org|eu|be|ch|io|info|biz|shop|store|site|online)\b/i,
  // Pseudo de réseau social : @mon.studio (un email est déjà couvert plus haut)
  /(?:^|[\s(])@[a-z0-9_.]{2,}/i,
];

export function containsContactInfo(text: string | null | undefined): boolean {
  if (!text) return false;
  return PATTERNS.some((re) => re.test(text));
}

/** Message affiché au prestataire quand sa fiche contient des coordonnées. */
export const CONTACT_INFO_FORBIDDEN_MESSAGE =
  "Pour protéger vos clients et vous, les coordonnées ne peuvent pas apparaître sur votre fiche : elles sont transmises au client dès qu'il accepte votre devis.";
