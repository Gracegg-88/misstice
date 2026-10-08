# Contenu des pages ville × événement

Un fichier par ville et par événement : `content/villes/<ville>/<evenement>.json`
(nom des fichiers = slugs des URL ; `ville` peut être écrit « Grenoble », il est normalisé. Ex. `grenoble/baby-shower.json` → `/baby-shower/grenoble`).
Chaque nouveau fichier doit être déclaré dans `content/villes/index.ts`.

**Règle absolue : aucun fait local inventé.** Un champ sans source fiable reste vide (`""` ou `[]`) ;
le modèle de page n'affiche que les sections remplies.

| Champ | Contenu attendu |
| --- | --- |
| `publier` | `true` / `false` — voir « Publication » ci-dessous. |
| `angle_local` | Introduction propre à la ville (obligatoire pour l'indexation). Paragraphes séparés par une ligne vide (`\n\n`). |
| `saison_et_meteo` | Texte rédigé. |
| `lieux` | Liste de fiches : `nom`, `type`, `quartier`, `capacite`, `fourchette_prix`, `convient_a`, `conseil` (texte). |
| `budget_local` | Texte rédigé. |
| `contraintes_pratiques` | Texte rédigé (accès, stationnement, réservations…). |
| `specialites_locales` | Texte rédigé. |
| `faq_locale` | Liste de `{ "question": "", "reponse": "" }`. |
| `sources` | Liste de `{ "sujet": "", "titre": "", "url": "", "consulte_le": "AAAA-MM-JJ" }` (le titre sert de texte du lien ; `sujet` n'est pas affiché). |
| `notes_internes_a_ne_pas_afficher` | Notes de travail, jamais affichées sur le site. |
| `derniere_mise_a_jour` | `AAAA-MM-JJ`. |
| `prestataires_mis_en_avant` | Liste de `{ "role": "", "prestataire_id": "", "rang": 1, "pourquoi": "", "date_verification": "AAAA-MM-JJ" }` — voir `ESSENTIAL_ROLES` dans `lib/city-content.ts`. `pourquoi` est rédigé à la main. |

## Publication

`"publier": false` (ou champ absent) : la page est en `noindex`, absente du sitemap, et aucun lien
interne (guide, page prestataires de la ville) ne pointe vers elle. Passer à `true` après relecture.
Garde-fou : même avec `true`, une fiche sans `angle_local` ou avec moins de 3 sections remplies
parmi `saison_et_meteo`, `lieux`, `budget_local`, `contraintes_pratiques`, `specialites_locales`,
`faq_locale` reste non publiée.

## Types de lieux

`lieux[].type` est affiché via un libellé lisible (`lieuTypeLabel` dans `lib/city-content.ts`) :
`domicile` → « À domicile », `restaurant-salon-de-the` → « Salon de thé ou restaurant »,
`salle` → « Salle de réception ». Un type inconnu est affiché sans tirets, avec une majuscule.

## Section « 3 prestataires »

Sélection automatique (un prestataire par rôle de `ESSENTIAL_ROLES`) parmi les fiches publiques de la
ville : catégorie du rôle, SIRET renseigné, puis fiche la plus complète. Une entrée de
`prestataires_mis_en_avant` force le choix pour son rôle.
