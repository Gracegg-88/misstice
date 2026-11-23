# Contenu des pages région (/region/<region>)

Un fichier par région : `content/regions/<slug-de-la-region>.json`, à déclarer dans
`content/regions/index.ts`. Partir de `_modele.json` (copier, renommer, remplir).
Le slug est le nom de la région en minuscules, sans accents, avec des tirets
(ex. « Auvergne-Rhône-Alpes » → `auvergne-rhone-alpes.json`). Le champ `region` doit
reprendre exactement le nom stocké en base (colonne `cities.region`).

**Règle absolue : aucun fait inventé, rien de copié depuis un autre site.** Un champ sans
source fiable reste vide ; la section correspondante n'est pas affichée.

| Champ | Contenu |
| --- | --- |
| `publier` | `false` tant que la page n'est pas relue. À `false` : noindex, hors sitemap, aucun lien vers la page. |
| `introduction` | Texte d'introduction (obligatoire pour l'indexation). Paragraphes séparés par une ligne vide. |
| `traditions_et_coutumes` | Traditions et coutumes de la région liées aux événements. |
| `lieux_de_reception_typiques` | Types de lieux de réception typiques de la région. |
| `meilleure_saison` | Saison(s) conseillée(s) et pourquoi. |
| `specialites_culinaires` | Spécialités à servir. |
| `budget_moyen` | Budget moyen, uniquement chiffré à partir de sources citées. |
| `faq` | `{ "question": "", "reponse": "" }` — affichée avec les données structurées FAQPage. |
| `sources` | `{ "sujet": "", "titre": "", "url": "", "consulte_le": "AAAA-MM-JJ" }` |
| `derniere_mise_a_jour` | `AAAA-MM-JJ` (sert aussi de date dans le sitemap). |
| `notes_internes_a_ne_pas_afficher` | Notes de travail, jamais affichées. |

La page liste automatiquement les villes de la région qui ont une page indexable.
