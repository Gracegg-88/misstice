# Note Google des prestataires (Google Maps Platform)

## Ce qui est affiché

Sur la fiche publique d'un prestataire dont la fiche Google a été **validée par
un admin**, un encadré « Note Google » montre le nom, la note et le nombre
d'avis Google, avec l'attribution Google, plus un lien « Voir les avis sur
Google Maps ». Il est séparé de la section « Avis Misstice ». Les avis Google
ne sont jamais comptés dans `vendors.rating` / `vendors.reviews`.

## Pourquoi pas de colonnes `google_rating` / `google_reviews_count`

Vérifié dans la documentation Google (octobre 2026) :

1. **Stockage** : les conditions Google Maps Platform (§ 3.2.3 et Places API
   Policies) interdisent de pré-charger, mettre en cache ou stocker le contenu
   Places. **Seul le `place_id` peut être conservé sans limite de durée.**
   Stocker la note ou le nombre d'avis, même rafraîchis par un cron, n'est pas
   autorisé.
2. **Comptes de facturation dans l'EEE** (Misstice, France) : depuis le
   8 juillet 2025, le contenu de la Places API ne peut être utilisé que pour
   9 usages listés (« Places API EEA Permitted Uses »). Afficher la note
   Google d'entreprises tierces sur une place de marché n'en fait pas partie.
   **Le Places UI Kit en est explicitement exempté** (EEA Service Specific
   Terms § 15.3).

D'où l'architecture :

| Étape | Outil Google | Ce qui transite chez Misstice | Coût |
| --- | --- | --- | --- |
| Trouver la fiche Google (admin / pro) | Text Search (New), masque `places.id` | `place_id` uniquement | Gratuit, illimité (SKU « Text Search Essentials (IDs Only) ») |
| Aperçu avant validation + affichage public | Places UI Kit, `<gmp-place-details-compact>` | Rien (affiché par Google dans le navigateur) | SKU « Places UI Kit Query » |
| Vérification mensuelle des `place_id` (cron) | Place Details (New), masque `id` | `place_id` uniquement | Gratuit, illimité (SKU « Place Details Essentials (IDs Only) ») |

Seuls sont stockés : `google_place_id`, `google_place_status`
(`a_valider` / `valide`), `google_place_linked_at`, `google_place_linked_by`,
`google_place_checked_at` (voir `supabase/google-places.sql`).

## Parcours

- **Admin** (`/admin/prestataires`, bouton « Google ») : recherche par
  « nom + ville » (modifiable), aperçu Google de chaque candidat, « Valider ce
  lieu » → visible immédiatement. Filtres « Fiche Google à valider » et
  « Fiche Google liée ».
- **Prestataire** (`/pro/profil`, « Connecter ma fiche Google ») : même
  recherche, « C'est ma fiche » → statut « à valider ». **Rien n'est public
  avant la validation par un admin** : un prestataire ne peut pas s'attribuer
  la note Google d'une autre entreprise. Un trigger en base empêche aussi
  toute écriture directe de ces colonnes depuis le navigateur.

## Configuration (à faire dans Google Cloud, puis Vercel)

1. Créer un projet Google Cloud, activer **Places API (New)** et
   **Maps JavaScript API**, lier un compte de facturation.
2. **Clé serveur** → `GOOGLE_PLACES_API_KEY` (Vercel, *sans* préfixe
   `NEXT_PUBLIC_`). Restriction d'API : Places API (New) uniquement.
3. **Clé navigateur** → `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`. Le Places UI
   Kit s'exécute dans le navigateur : cette clé est forcément visible, c'est
   prévu par Google. Restrictions obligatoires : sites référents
   `https://www.misstice.com/*`, `https://misstice.com/*` (+ domaines de
   préversion Vercel si besoin), API : Maps JavaScript API uniquement.
4. Exécuter `supabase/google-places.sql` dans Supabase.
5. Recommandé : définir un plafond de budget et des alertes dans la console
   Google Cloud (Facturation → Budgets et alertes).

Sans clé navigateur, l'encadré « Note Google » et les boutons de connexion
n'apparaissent pas (aucune erreur visible).

## Estimation du coût mensuel (400 fiches)

Le coût ne dépend pas du nombre de fiches mais du **nombre d'affichages** de
l'encadré Google (chargé seulement quand le visiteur fait défiler la page
jusqu'à lui). Tarif « Places UI Kit Query » (grille Google d'octobre 2026) :
**10 000 affichages gratuits par mois**, puis **1 $ les 1 000** (dégressif
au-delà de 100 000).

| Affichages de l'encadré / mois | Coût estimé |
| --- | --- |
| 8 000 (ex. 400 fiches × 20 vues) | 0 $ |
| 20 000 | ≈ 10 $ (≈ 9 €) |
| 50 000 | ≈ 40 $ (≈ 37 €) |
| 100 000 | ≈ 90 $ (≈ 83 €) |

Recherches de `place_id` et vérifications mensuelles : 0 $. Les aperçus côté
admin / pro comptent comme des affichages (négligeable).

Sources : Google Maps Platform Service Specific Terms (Places API § 5.4),
Places API Policies (« Exceptions from caching restrictions »), EEA Service
Specific Terms § 15, Places API EEA Permitted Uses, grille tarifaire
« Google Maps Platform core services pricing list ».
