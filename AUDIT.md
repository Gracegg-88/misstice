# 🔍 Audit technique, fonctionnel & architectural — Projet **Misstice**

> **Date de l'audit :** 2026-07-13
> **Méthode :** analyse récursive fichier par fichier depuis le point d'entrée (`middleware.ts` → layouts → pages → composants → couche `lib/` → SQL/RLS), croisée avec `tsc --noEmit` (✅ 0 erreur) et vérification du schéma effectif.
> **Réalisé par :** audit multi-agents (QA senior · Architecte logiciel · Auditeur sécurité).

---

## Contexte technique

| | |
|---|---|
| **Framework** | Next.js 14.2 (App Router) · React 18 |
| **Backend** | Supabase (Auth + Postgres + RLS + Realtime + Storage) |
| **Services** | Nodemailer/Brevo (email) · Cloudinary (média) · Leaflet (carte) |
| **UI** | TailwindCSS · lucide-react |
| **Volume analysé** | ~22 000 lignes TS/TSX (90 fichiers) + ~40 fichiers SQL + 7 routes API + middleware |

**Convention de gravité :** les analyses ont majoritairement utilisé « Élevée » comme plafond. Deux findings ont été **réhaussés à Critique** car ils bloquent réellement la mise en production (intégrité financière + XSS stocké).

---

## 🟥 Blocages critiques (production interdite en l'état)

### CRIT-1 — Un client peut modifier le montant/statut de n'importe quel devis

- **Fichier :** `supabase/pro.sql`
- **Ligne :** 38-43 (policy `quotes_update`)
- **Gravité :** 🔴 Critique
- **Catégorie :** Sécurité / Autorisation (RLS niveau colonne absent)
- **Description :** `quotes_update` autorise **tout participant** de la conversation (donc le particulier) à faire un `UPDATE` sur la ligne `quotes`, sans `WITH CHECK` restreignant les colonnes. La clé `anon` étant publique, un client peut forger un appel Supabase et modifier `amount`, `items`, `service_fee`, `tax_rate`, `status`.
- **Impact :** Falsification du montant d'un devis émis par le prestataire ; auto-passage à `accepté` déclenchant `quote_booking_sync` (réservation du créneau) ; incohérence comptable totale. **Fraude directe.**
- **Correction recommandée :** Retirer le droit `UPDATE` direct aux non-prestataires ; passer par une RPC `SECURITY DEFINER respond_to_quote(p_quote, p_status)` qui vérifie l'appartenance et n'écrit **que** `status`.

### CRIT-2 — XSS stocké via les marqueurs `[[img:…]]` / `[[doc:…]]` de la messagerie

- **Fichier :** `components/messaging/ConversationThread.tsx`
- **Ligne :** 357-376 et 391-409
- **Gravité :** 🔴 Critique
- **Catégorie :** Sécurité / XSS (pseudo-protocole `javascript:`)
- **Description :** Le corps d'un message est du texte libre non validé (la policy `msg_insert` ne contrôle que l'expéditeur). Un participant peut envoyer `[[img:javascript:alert(document.cookie)]]`. Les regex `IMG_RE`/`DOC_RE` acceptent n'importe quels caractères et l'URL est posée telle quelle dans `<a href=…>` / `<img src=…>`.
- **Impact :** XSS stocké déclenché au clic → vol de session Supabase, actions au nom de la victime. `rel="noopener"` n'empêche pas l'exécution du pseudo-protocole.
- **Correction recommandée :** N'autoriser que `http(s):` (idéalement uniquement les URLs Cloudinary) avant de rendre `href`/`src` ; mieux : ne pas dériver ces marqueurs d'un corps texte forgeable (colonne/type de message dédié).

---

## 🟧 Gravité élevée

### HIGH-1 — Relais d'email ouvert authentifié

- **Fichier :** `app/api/notify-assignment/route.ts`
- **Ligne :** 27-37, 79
- **Catégorie :** Autorisation
- **Description :** Contrairement à `send-invite`/`send-rsvp` qui résolvent le destinataire depuis la base via RLS, cette route fait entièrement confiance au `body` (`email`, `name`, `taskLabel`, `eventName`, `assignerName`). Seul `getUser()` est vérifié. Le commentaire « empêche le relais ouvert » est **faux**.
- **Impact :** Tout compte enregistré (inscription ouverte) peut envoyer un email au design Misstice, depuis le domaine expéditeur Misstice, vers une adresse arbitraire → phishing/spam à grande échelle, réputation du domaine Brevo dégradée.
- **Correction recommandée :** Résoudre le collaborateur depuis la base via un `id` (RLS `can_access_event`), jamais depuis le corps.

### HIGH-2 — Avis/notes fictifs affichés publiquement (promesse « avis vérifiés » cassée)

- **Fichier :** `app/prestataires/[id]/page.tsx` + `components/explorer/VendorProfile.tsx`
- **Ligne :** page 72-75 / profil 434-506
- **Catégorie :** Intégrité données (mock exposé)
- **Description :** Les 18 fiches de `vendors.sql` sont seedées avec `rating`/`reviews` inventés (ex. 4.9 / 127 avis) alors qu'**aucune** ligne réelle n'existe dans `reviews`. `getReviewStats` renvoie `count = 0`, mais l'affichage se base sur la colonne seed `vendor.reviews` (127) → bloc « Avis (127) », note 4,9, répartition à **0 % partout**, et `reviews.map` sur un tableau **vide**.
- **Impact :** Section visuellement cassée ET trompeuse (fausses notes sur pages publiques), en contradiction directe avec l'argument marketing central. Risque crédibilité/conformité.
- **Correction recommandée :** Faire dériver `rating`/`reviews` affichés **uniquement** de `getReviewStats` ; neutraliser (0) les compteurs seed des fiches vitrines.

### HIGH-3 — Invitation d'admin : faux succès + admin non connectable

- **Fichier :** `app/api/admin/invite-admin/route.ts`
- **Ligne :** 60-77, 102-123
- **Catégorie :** Faille logique / configuration
- **Description :** (a) La détection de doublon repose sur `signUpErr.message.includes("registered")`. Avec la protection anti-énumération de Supabase (activée par défaut), un email existant renvoie un `user` obfusqué (`identities: []`) **sans erreur** → `sadmin_promote` sur un UUID factice (no-op), `{ok:true}` renvoyé, email avec identifiants inopérants. (b) Le compte est créé via `anon.signUp` : si « Confirm email » est activé, la connexion par mot de passe est refusée.
- **Impact :** « Invitation envoyée » affiché alors qu'aucun admin n'est promu ; ou admin incapable de se connecter. Onboarding admin cassé selon la config.
- **Correction recommandée :** Utiliser `auth.admin.createUser({ email_confirm: true })` (service-role) ; vérifier `signUp.user?.identities?.length === 0` pour détecter les doublons.

### HIGH-4 — Liste des admins non rafraîchie après invitation

- **Fichier :** `components/admin/AdminsClient.tsx`
- **Ligne :** 41, 79-86
- **Catégorie :** Bug logique / synchro état React
- **Description :** `useState(initial)` n'est initialisé qu'au montage. `invite()` ne fait pas de `setAdmins` optimiste et s'appuie sur `router.refresh()` — mais `useState` ignore le nouveau prop `initial`. Le nouvel admin n'apparaît jamais sans F5.
- **Impact :** Le super-admin croit l'action échouée → risque de double invitation sur une opération sensible.
- **Correction recommandée :** `useEffect(() => setAdmins(initial), [initial])`, ou insertion optimiste, ou rendre directement `initial`.

### HIGH-5 — Upload photo « book » échoue pour un nouveau prestataire

- **Fichier :** `components/pro/ProfilClient.tsx`
- **Ligne :** 333-375 (`onUpload`)
- **Catégorie :** Intégrité référentielle
- **Description :** `onUpload` insère dans `vendor_photos` avec `vendor_id: vendor.profileId` **sans appeler `ensureProfile()`** (contrairement à `addPackage`). Pour un prestataire « shell » (aucune ligne `vendor_profiles`), l'upload storage réussit puis l'INSERT viole la FK (23503).
- **Impact :** Fichier orphelin dans le bucket + message d'erreur brut ; fonctionnalité inutilisable pour les nouveaux comptes.
- **Correction recommandée :** `await ensureProfile()` en tête de `onUpload`, avant tout upload.

---

## 🟨 Gravité moyenne

Format condensé — `Fichier:Ligne` · Catégorie · Description → Correction.

### Sécurité / API

- `next.config.mjs`:2-14 · XSS · **Aucune CSP** (les autres en-têtes sont bons) → ajouter une CSP restrictive (report-only d'abord).
- `app/api/extract-media/route.ts`:42-64 · SSRF (DNS rebinding/TOCTOU) · `assertSafeUrl` résout le DNS, puis `fetch` re-résout indépendamment → épingler l'IP validée (agent `lookup` custom rejouant `isPrivateIp`).
- `app/api/send-invite/route.ts`:52-60 (+ `invite-admin`) · Injection Host/Phishing · `inviteUrl` construit depuis `x-forwarded-host` → utiliser `NEXT_PUBLIC_SITE_URL` de confiance.
- `lib/email.ts`:31 · Injection d'en-tête SMTP · `opts.to` jamais validé/assaini → regex email stricte rejetant `\r\n,;<>`.
- Toutes routes API · Absence de **rate limiting** (surtout envoi d'emails + `extract-media`) → Upstash Ratelimit ou compteurs.
- `app/api/cron/weekly-digest/route.ts`:44-50 · Scalabilité · `listUsers({perPage:1000})` une seule page → paginer (au-delà de 1000 comptes, prestataires exclus silencieusement du digest).

### RLS / migrations

- `supabase/schema.sql` (vs `permissions.sql`):192-214 · RLS trop permissive · Les policies de base `budget_*_access` sont `FOR ALL USING(can_access_event)` — tout membre peut écrire tant que `permissions.sql` n'a pas été rejoué. La sécurité dépend de **l'ordre d'exécution manuel** des scripts → consolider en migrations ordonnées idempotentes.

### Espace pro

- `components/pro/ProfilClient.tsx`:377-392, 162-184 · Fuite storage · `deletePhoto`/`onUploadMain` ne suppriment jamais l'objet du bucket → `storage.remove([path])`.
- `components/pro/ProfilClient.tsx`:162-184 · UX trompeuse · « Changer la photo » ne persiste `vendors.image` qu'au « Enregistrer » ultérieur, sans indice → persister immédiatement ou avertir.
- `components/pro/DevisForm.tsx`:178-182 · Gestion d'erreur · L'insert du message `[[devis:…]]` n'est pas vérifié → si échec, devis « fantôme » invisible côté client.
- `lib/pro.ts`:195-222 · Incohérence de compteur · `getProStats.demandes` compte **toutes** les conversations, alors que la page Demandes filtre `demande != null` → deux chiffres divergents.

### Messagerie / devis

- `components/devis/DevisActions.tsx`:43-118 · Cohérence d'état · Les écritures secondaires (`conversations.update`, `event_vendors`) ne vérifient jamais `error` → rattachement prestataire silencieusement perdu.
- `components/devis/DevisActions.tsx`:116 + `app/devis/[id]/page.tsx`:82 · Donnée obsolète · Pas de `router.refresh()` après accept/refus → le badge du document reste « En attente ».

### Composants dashboard

- `components/dashboard/DashboardTopbar.tsx`:75-127 · Bug UX · Menu utilisateur sans fermeture au clic extérieur (contrairement aux autres) → overlay `fixed inset-0`.
- `components/dashboard/FavoriteVendorsClient.tsx`:32-43 · Chargement bloqué · `.then()` sans `.catch()` → écran figé sur « Chargement… » en cas de coupure réseau.
- `components/dashboard/ChecklistClient.tsx`:104-125 · Échec silencieux · Erreur d'insertion non affichée → l'utilisateur croit avoir ajouté une tâche.
- Multiples (`BookedVendors`, `GiftList`, `Planning`, `Seating`, `Checklist`…) · Données ≠ BDD · Les DELETE/UPDATE optimistes ne vérifient pas le nombre de lignes affectées (seul `BudgetClient` le fait) → un blocage RLS passe pour un succès puis l'élément réapparaît.

### Dashboard pages / data

- `lib/dashboard.ts` + `lib/queries.ts` (toutes fonctions) · Erreurs non gérées · Motif systématique `const {data} = …; return data ?? []` — `error` **toujours** ignoré → panne BDD indiscernable de « aucune donnée ».
- `app/dashboard/page.tsx`:67 vs `app/dashboard/budget/page.tsx`:24 · Calcul incohérent · L'overview applique un repli `budget_total || Σcatégories`, la page Budget non → total et % différents pour la même donnée.
- `lib/dashboard.ts`:99-107 · Code mort · `getVendorCalls()` + type `VendorCall` + table `vendor_calls` : **aucun consommateur** (Agenda jamais livré).

### Public / explorer

- `components/explorer/VendorCard.tsx`:90-91 · Mock exposé · `rating`/`reviews` seed fictifs sur page d'accueil + explorateur → dériver de `reviews`.
- `components/TrustBar.tsx`:3-8 · Code mort + stats fabriquées · Jamais importé ; « 12 000+ événements », « 4,9/5 » inventés → supprimer ou brancher sur agrégats réels.
- `components/explorer/profileData.ts`:55-104 · Mock d'avis mort · `getReviews`/`ratingBreakdown` (faux avis « Sophie M. »…) jamais importés → supprimer.
- `components/ReviewsCard.tsx`:6-28 · Faux témoignages · 3 témoignages nominatifs en dur rendus sur la landing → table `testimonials` ou assumer « exemples ».
- `lib/useFavorites.ts`:8-63 · Fonctionnalité partielle · Favoris en **localStorage uniquement**, aucune persistance BDD, aucune page « Mes favoris » consommatrice → table `vendor_favorites` + écran dédié.

---

## 🟩 Gravité faible (regroupé)

**Sécurité/robustesse (12) :** énumération de comptes sur `/creer`:120 et `invite-admin`:66 · open-redirect perméable aux backslashes (auth/callback/creer, dupliqué ×4) · reset password validé côté client seulement (≥6) et sur *n'importe quelle* session active · `getEventAccess` n'exige pas `status='accepted'` · triple définition de `handle_new_user` (schema/pro/security) · `guest_rsvp_info` exposée à `anon` (par conception) · comparaison non constante du `CRON_SECRET` · erreurs Supabase ignorées dans le cron · mot de passe temporaire renvoyé en clair (invite-admin + AdminsClient UI) · plages IP SSRF incomplètes · URL OG extraite non validée · pas de rate-limit brute-force login.

**Espace pro (7) :** sparkline « Revenu estimé » trace un *nombre* pas des € · « Vues » total all-time juxtaposé à un badge « 7 jours » · note calendrier perdue si un devis accepté est annulé (`quote_booking_sync` DELETE) · `withEuro` dupliqué inline · `demandesSpark` non filtré · `DemandesClient` affiche `last_message_at` sous une icône calendrier · `guests_count` envoyé même quand le champ est masqué.

**Composants dashboard (10) :** `BookedVendors` insert omet `image` · `NotificationBell` fuite d'abonnement au démontage rapide + realtime INSERT-only · `ChecklistCard` prop `eventId` inutilisée + `slice(0,6)` sans « voir tout » · `InvitesClient` collision de clés React sur groupe nommé comme un statut · `BudgetClient` `NaN` sur saisie non numérique + « restant » négatif vs « 0 % disponible » · `EventsManager` cookie obsolète après suppression du dernier événement · pattern `useState(initial)` + `router.refresh()` = double fetch inutile · modales sans gestion Échap/`role=dialog` (a11y).

**Dashboard pages (8) :** absence de `loading.tsx`/`error.tsx` · colonnes `numeric` typées `number` mais `string` au runtime · badges invités ne totalisent pas (`décliné` absent) · `bookedVendors` inclut les `refusé` comptés comme « réservés » · `getReceivedQuotes` non scopée à l'événement · `getBudgetCategories` hors du `Promise.all` (séquentiel) · appels `auth.getUser()` redondants par page · parsing de date incohérent (UTC vs local → décalage d'un jour).

**Public/explorer (8) :** `useFavorites` race d'auth (`null` non prêt) · `Header` FOUC connecté/déconnecté · `rsvp` dépend de l'ordre `invitation-card.sql`/`event-details.sql` · `priceFrom` vide affiché sans repli « Sur devis » · champs `region`/`languages`/`responseHours` chargés mais jamais affichés (filtre langues inexistant) · tri des villes non localisé · `VendorsMap` typé `any` · `/creer` affiche le succès en style d'erreur (rouge).

**Messagerie (7) :** double appel `mark_conversation_read` · aucune pagination des messages · helpers date/regex dupliqués ×3 · « Vu » et sidebar non temps réel (lus une fois au rendu serveur) · « Télécharger le devis » = `window.print()`, pas un vrai PDF · pied de page `DevisDocument` en dur (`contact@misstice.com`) · chat d'équipe sans pièces jointes.

**Admin (5) :** incohérence de couleurs cartes vs donut · double vague de requêtes sur l'overview · garde de rôle sur un point unique (layout) pour 4 pages · `ConfirmDialog` sans état `loading` (double-clic possible) · policies `admin.sql` sur `vendor_profiles` vestigiales (l'admin opère sur `vendors`).

---

## ✅ Points forts vérifiés (non-défauts confirmés)

- **`service_role` jamais exposée au client** (uniquement `lib/supabase/admin.ts` + cron protégé par `CRON_SECRET`, fail-closed).
- **Défense en profondeur auth solide** : middleware fail-closed sur `/dashboard /pro /admin` + garde de **rôle côté serveur** dans les layouts + RLS. `getUser()` (pas `getSession()`) partout → jeton réellement validé.
- **Anti-escalade de rôle** : `handle_new_user` assainit le rôle client, `freeze_profile_role`, `protect_vendor_columns`, `set_review_author` — usurpation impossible.
- **Admin réellement sécurisé** : toutes mutations via RPC `SECURITY DEFINER` re-vérifiant le rôle, anti-auto-ciblage (anti-lock-out). Aucune faille d'autorisation admin exploitable.
- **Messagerie** : channels realtime correctement nettoyés, déduplication robuste (`prev.some(id)` + index unique), lecture protégée par RLS, chat d'équipe écrit via RPC dénormalisant l'identité réelle.
- **Cloudinary** : autorisation requise avant signature, secret jamais exposé.
- **`tsc --noEmit` : 0 erreur.** Aucun `dangerouslySetInnerHTML` ni `alert()`.

---

## 📊 Synthèse finale

### 1. Fichiers analysés

Intégralité du code source : middleware + 4 clients Supabase · 7 routes API + `lib/email`/`cloudinary` · dashboard particulier (14 pages + 3 modules `lib`) · 20 composants dashboard · espace pro (7 pages + 11 composants + `lib/pro`) · admin (7 pages + 9 composants) · messagerie/devis (3 `lib` + 4 composants + 7 pages + 2 composants devis) · public/explorer/événements (15 pages + 12 composants landing + 7 composants explorer + `lib/vendors`/`vibes`/`useFavorites`) · ~40 fichiers SQL (RLS/policies/triggers/RPC). **≈ 90 fichiers TS/TSX + 40 SQL.**

### 2. Nombre total de problèmes détectés : **≈ 100**

### 3. Répartition par gravité

| Gravité | Nombre |
|---|---|
| 🔴 Critique | **2** |
| 🟧 Élevée | **5** |
| 🟨 Moyenne | **~26** |
| 🟩 Faible | **~67** |

### 4. Fonctionnalités incomplètes

1. **Agenda / rendez-vous prestataires** (`vendor_calls` + `getVendorCalls`) : BDD + couche data présentes, **aucune UI**.
2. **Favoris** : localStorage seulement, pas de persistance BDD, pas de page « Mes favoris ».
3. **Accusé « Vu » & sidebar messagerie** : non temps réel (figés jusqu'au refresh).
4. **Pagination des messages** : absente (tout chargé).
5. **Génération PDF du devis** : `window.print()` seulement.
6. **Pièces jointes dans le chat d'équipe** : non gérées.
7. **États de chargement/erreur du dashboard** : pas de `loading.tsx`/`error.tsx`, erreurs BDD avalées silencieusement.
8. **Envoi du devis dans la conversation** : insertion non vérifiée → risque de devis « fantôme ».
9. **Modération automatique des badges Vibe** : annoncée en UI, non implémentée (reportée au dashboard admin — cohérent avec la décision projet).
10. **Rate limiting** : absent sur toutes les routes.

### 5. Éléments statiques qui devraient être dynamiques

| Élément | Statut actuel | Source attendue |
|---|---|---|
| Notes/avis des cartes & fiches prestataires | Colonnes seed `vendors.rating/reviews` **fabriquées** | Agrégat table `reviews` (`getReviewStats`) |
| `TrustBar` (12 000+, 3 500+, 4,9/5) | En dur + **code mort** | Comptages `profiles`/`events`/`vendors` |
| `ReviewsCard` (3 témoignages) | Nominatifs en dur sur landing | Table `testimonials` / avis mis en avant |
| `profileData.getReviews`/`ratingBreakdown` | Faux avis (code mort) | À **supprimer** |
| Pied de page `DevisDocument` | `contact@misstice.com` en dur | Coordonnées plateforme/prestataire |
| Sparkline « Revenu estimé » (pro) | Trace un *nombre* de devis | Somme des `amount` acceptés/jour |

> ✅ **Bonne nouvelle majeure** : les espaces **particulier, pro et admin sont désormais entièrement branchés sur Supabase** (aucune donnée métier mockée résiduelle). Les mocks subsistent uniquement sur les **fiches vitrines publiques** (avis/notes) et quelques composants de code mort.

### 6. Blocages critiques empêchant la mise en production

1. **CRIT-1** — RLS `quotes_update` : client peut modifier montant/statut d'un devis (fraude + réservation auto).
2. **CRIT-2** — XSS stocké via marqueurs `[[img/doc:javascript:]]` (vol de session).
3. **HIGH-1** — Relais d'email ouvert (`notify-assignment`) : spam/phishing depuis le domaine Misstice.
4. **HIGH-2** — Faux avis/notes affichés publiquement (contredit la promesse « avis vérifiés » — risque conformité).
5. **HIGH-3** — Invitation admin : faux succès / admin non connectable selon config Supabase.

*Pré-requis production complémentaires : CSP + rate limiting + gestion d'erreurs de la couche `lib` (actuellement silencieuse) + consolidation de l'ordre des migrations SQL.*

### 7. Diagnostic global

Projet **fonctionnellement riche et architecturalement sain** : séparation Server/Client Components propre, **défense en profondeur d'authentification exemplaire** (middleware + rôle serveur + RLS), migration mock → Supabase largement aboutie sur les espaces authentifiés, TypeScript compile sans erreur, très peu de dette de mock. Les fondations de sécurité sont **au-dessus de la moyenne** pour ce type de produit.

Les faiblesses sont **ciblées et réparables** : deux failles critiques précises (une RLS, un XSS), une **couche de données qui avale toutes les erreurs** (robustesse et debuggabilité fortement dégradées), une **dépendance fragile à l'ordre manuel des scripts SQL**, et une **façade publique qui affiche de fausses données d'avis** incompatible avec le positionnement marketing. Aucune anomalie n'est structurellement bloquante à corriger — mais les 5 points ci-dessus **doivent** l'être avant tout lancement.

### 8. Évaluation finale /100

| Axe | Note | Justification |
|---|---:|---|
| **Qualité du code** | **72** | TS strict OK, code lisible, peu de mock ; pénalisé par la gestion d'erreur systématiquement absente et quelques duplications (helpers, `withEuro`, open-redirect ×4). |
| **Robustesse** | **56** | Erreurs BDD avalées partout, pas de `loading.tsx`/`error.tsx`, DELETE/UPDATE sans vérification du rowcount, `NaN`/null non gardés localement. |
| **Sécurité** | **60** | Socle auth/RLS/anti-escalade excellent, mais **2 critiques** (quotes RLS, XSS), pas de CSP ni rate limiting, SSRF résiduel, relais email ouvert. |
| **Architecture** | **74** | Découpage propre, RLS en défense de fond ; pénalisé par la fragilité de l'ordre des migrations SQL et le code mort (`vendor_calls`, `TrustBar`). |
| **Expérience utilisateur** | **64** | Parcours globalement complets ; nombreuses interactions **trompeuses** (faux avis, échecs silencieux, statut devis figé, menus non fermables). |
| **Maintenabilité** | **70** | Types + composants cohérents ; pénalisé par helpers dupliqués, code mort et dépendance à l'ordre d'exécution SQL non versionné. |
| **🎯 Score global** | **≈ 66/100** | Base solide, **non déployable en l'état** tant que les 5 blocages ne sont pas traités. |

---

## Prochaine étape recommandée (ordre de priorité)

1. **CRIT-1** — RLS `quotes_update`
2. **CRIT-2** — XSS marqueurs messagerie
3. **HIGH-1** — Relais email ouvert
4. **HIGH-2** — Faux avis publics
5. **HIGH-3** — Invitation admin
6. Gestion d'erreurs de `lib/dashboard.ts` / `lib/queries.ts`
7. CSP + rate limiting
8. Consolidation / versionnement des migrations SQL
