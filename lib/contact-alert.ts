"use client";

import { useEffect, useRef } from "react";

// Détection de coordonnées personnelles dans un message en cours de saisie.
// Ne bloque RIEN : sert uniquement à ouvrir la mascotte (GuideMascot) avec un
// avertissement de prudence. Le paiement sécurisé + double validation reste
// la vraie protection contre les échanges hors plateforme.

const PATTERNS: RegExp[] = [
  // Email, y compris les formes déguisées : « jean (at) gmail point com »
  /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\sarobase\s)\s*[a-z0-9-]+(?:\s*(?:\.|\(dot\)|\[dot\]|\spoint\s)\s*[a-z0-9-]+)*\s*(?:\.|\(dot\)|\[dot\]|\spoint\s)\s*[a-z]{2,}/i,
  // Téléphone français : 06 12 34 56 78, 06.12.34.56.78, +33 6 12 34 56 78
  /(?:(?:\+|00)\s*33\s*\(?0?\)?\s*|\b0)[1-9](?:[\s.-]*\d{2}){4}\b/,
  // Autre numéro international : +44 7911 123456…
  /\+\s*\d{1,3}(?:[\s.-]*\d){8,}/,
  // IBAN (paiement hors plateforme)
  /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b/,
  // Messageries / moyens de paiement externes
  /\b(?:whats\s?app|telegram|snap(?:chat)?|insta(?:gram)?|paypal|lydia|iban|rib)\b/i,
];

export function containsContactInfo(text: string): boolean {
  return PATTERNS.some((re) => re.test(text));
}

export const CONTACT_ALERT_EVENT = "misstice:contact-alert";

export const CONTACT_ALERT_TEXT =
  "🔐 Attention : tu sembles partager des coordonnées personnelles (email, téléphone, réseau social…). Pour ta sécurité, garde tes échanges et tes paiements sur Misstice : en dehors de la plateforme, tu n'es plus protégé·e par le paiement sécurisé et la double validation.";

/**
 * Ouvre la mascotte avec l'avertissement dès que le texte saisi se met à
 * contenir des coordonnées — une seule fois tant qu'elles restent présentes
 * (pas de répétition à chaque frappe).
 */
export function useContactInfoAlert(text: string) {
  const alerted = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = containsContactInfo(text);
      if (found && !alerted.current) {
        alerted.current = true;
        window.dispatchEvent(new CustomEvent(CONTACT_ALERT_EVENT));
      } else if (!found) {
        alerted.current = false;
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [text]);
}
