"use client";

import { useEffect, useRef } from "react";
import { CONTACT_INFO_FORBIDDEN_MESSAGE, containsContactInfo } from "@/lib/contact-detection";

// Avertissement de coordonnées personnelles dans un message en cours de
// saisie. Ne bloque RIEN : sert uniquement à ouvrir la mascotte (GuideMascot)
// avec un avertissement de prudence. Le paiement sécurisé + double validation
// reste la vraie protection contre les échanges hors plateforme.
// La détection elle-même est partagée avec la fiche prestataire, où elle
// bloque l'enregistrement : voir lib/contact-detection.ts.
export { CONTACT_INFO_FORBIDDEN_MESSAGE, containsContactInfo };

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
