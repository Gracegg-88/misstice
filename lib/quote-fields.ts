// Logique « catégorie » du devis — SANS dépendance serveur (importable client).
// Une seule source de vérité pour : les champs de la demande, l'usage du nombre
// d'invités, et les lignes de prestation pré-remplies à partir de la demande.

export type QField = {
  key: string;
  label: string;
  type?: "number" | "text";
  placeholder?: string;
};

export type DemandeItem = { label: string; description: string; qty: number };

const lc = (c: string | null) => (c ?? "").toLowerCase();
const hasKw = (c: string, ...kw: string[]) => kw.some((k) => c.includes(k));

const GUESTS_KW = [
  "traiteur", "food truck", "bar ", "pâtiss", "patiss", "glace", "bonbon", "confiseur",
  "lieu", "salle", "domaine", "château", "chateau", "tente", "chapiteau", "hébergement",
  "hebergement", "sanitaire", "mobilier", "vaisselle", "linge", "nappage", "sécurité",
  "securite", "fleur", "décor", "decor",
];

/** Champs de la demande adaptés au métier du prestataire. */
export function quoteFields(category: string | null): QField[] {
  const c = lc(category);
  const has = (...kw: string[]) => hasKw(c, ...kw);
  if (has("maquill"))
    return [{ key: "personnes", label: "Nombre de personnes à maquiller", type: "number", placeholder: "ex. 3" }];
  if (has("coiff"))
    return [{ key: "personnes", label: "Nombre de personnes à coiffer", type: "number", placeholder: "ex. 3" }];
  if (has("photograph", "vidéast", "video", "vidéo", "photobooth"))
    return [{ key: "duree", label: "Durée de couverture souhaitée", placeholder: "ex. journée complète, 4h…" }];
  if (has("dj", "sono", "music", "chanteur", "éclairage", "sonoris"))
    return [{ key: "duree", label: "Durée de la prestation", placeholder: "ex. soirée, 5h…" }];
  if (has("traiteur", "food truck", "bar ", "pâtiss", "patiss", "glace", "bonbon", "confiseur"))
    return [
      { key: "invites", label: "Nombre d'invités", type: "number", placeholder: "ex. 80" },
      { key: "regime", label: "Régimes / allergies", placeholder: "ex. végétarien, halal, sans gluten…" },
    ];
  if (has("lieu", "salle", "domaine", "château", "chateau", "tente", "chapiteau", "hébergement", "hebergement", "sanitaire", "mobilier", "vaisselle", "linge", "nappage", "sécurité", "securite"))
    return [{ key: "invites", label: "Nombre d'invités", type: "number", placeholder: "ex. 120" }];
  if (has("animation", "magicien", "spectacle", "gonflable", "jeux", "casino", "baby", "enfant"))
    return [
      { key: "enfants", label: "Nombre de participants", type: "number", placeholder: "ex. 15" },
      { key: "duree", label: "Durée souhaitée", placeholder: "ex. 2h" },
    ];
  if (has("fleur", "décor", "decor"))
    return [
      { key: "invites", label: "Nombre d'invités (indicatif)", type: "number", placeholder: "ex. 80" },
      { key: "ambiance", label: "Ambiance / thème", placeholder: "ex. bohème, champêtre…" },
    ];
  if (has("transport", "navette", "voiture", "voiturier"))
    return [{ key: "personnes", label: "Nombre de personnes à transporter", type: "number", placeholder: "ex. 30" }];
  return [];
}

/** La catégorie a-t-elle du sens avec un « nombre d'invités » ? (maquilleuse = non) */
export function categoryUsesGuests(category: string | null): boolean {
  return hasKw(lc(category), ...GUESTS_KW);
}

const qty = (v?: string) => {
  const n = parseInt((v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

/**
 * Lignes de prestation pré-remplies à partir de la demande du client.
 * Le prestataire n'aura plus qu'à saisir le prix unitaire.
 */
export function demandeItems(
  category: string | null,
  a: Record<string, string>
): DemandeItem[] {
  const c = lc(category);
  const has = (...kw: string[]) => hasKw(c, ...kw);
  const item = (label: string, description = "", q = 1): DemandeItem => ({
    label,
    description,
    qty: q,
  });

  if (has("maquill")) return [item("Maquillage", "", qty(a.personnes))];
  if (has("coiff")) return [item("Coiffure", "", qty(a.personnes))];
  if (has("photograph", "vidéast", "video", "vidéo", "photobooth"))
    return [item("Couverture photo / vidéo", a.duree ?? "", 1)];
  if (has("dj", "sono", "music", "chanteur", "éclairage", "sonoris"))
    return [item("Animation musicale", a.duree ?? "", 1)];
  if (has("traiteur", "food truck", "bar ", "pâtiss", "patiss", "glace", "bonbon", "confiseur"))
    return [item("Prestation traiteur", a.regime ?? "", qty(a.invites))];
  if (has("lieu", "salle", "domaine", "château", "chateau", "tente", "chapiteau", "hébergement", "hebergement", "sanitaire", "mobilier", "vaisselle", "linge", "nappage", "sécurité", "securite"))
    return [item("Location de l'espace", "", 1)];
  if (has("animation", "magicien", "spectacle", "gonflable", "jeux", "casino", "baby", "enfant"))
    return [item("Animation", a.duree ?? "", qty(a.enfants))];
  if (has("fleur", "décor", "decor"))
    return [item("Décoration florale", a.ambiance ?? "", 1)];
  if (has("transport", "navette", "voiture", "voiturier"))
    return [item("Transport", "", qty(a.personnes))];

  return [item(category?.trim() || "Prestation", "", 1)];
}
