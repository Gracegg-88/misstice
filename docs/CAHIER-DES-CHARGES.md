# Cahier des charges — Misstice

**Plateforme d'organisation d'événements familiaux & espace prestataires**

| | |
|---|---|
| **Projet** | Misstice |
| **Version du document** | 1.0 |
| **Date** | Juillet 2026 |
| **Statut du produit** | En développement — socle opérationnel posé (auth + base de données + module Budget) |
| **Promesse** | « On transforme le stress de l'organisation en plaisir. » |

---

## 1. Présentation du projet

### 1.1 Contexte

Organiser un événement familial (mariage, anniversaire, baptême, gala) implique de jongler entre un budget, une liste d'invités, une checklist de tâches, une équipe de proches et de nombreux prestataires. Ces informations sont aujourd'hui éparpillées entre tableurs, messageries et notes — source de stress et d'oublis.

En parallèle, les prestataires (traiteurs, photographes, salles, DJ…) manquent d'un canal simple pour recevoir des demandes qualifiées, envoyer des devis et gérer leur calendrier.

### 1.2 Vision

Réunir sur **une seule plateforme** les familles qui organisent et les prestataires qui réalisent, en gardant toute la relation centralisée sur Misstice (découverte, échange, devis, réservation).

Positionnement produit : **« la rigueur d'un Notion, la créativité d'un Canva »**, pensé pour les fêtes de famille francophones.

### 1.3 Objectifs

| # | Objectif | Indicateur de succès |
|---|----------|----------------------|
| O1 | Centraliser l'organisation d'un événement | Un utilisateur gère budget + invités + checklist + équipe sans quitter la plateforme |
| O2 | Connecter familles et prestataires | Une demande de devis aboutit à un échange puis une réservation dans l'outil |
| O3 | Réduire la charge mentale | Suivi de progression, rappels, répartition des tâches dans l'équipe |
| O4 | Offrir un espace pro attractif | Le prestataire gère demandes, devis, agenda et vitrine depuis un tableau de bord |

---

## 2. Public cible

### 2.1 Persona A — La famille organisatrice (« particulier »)

- **Qui** : particulier(s) organisant un événement, souvent en couple ou en famille, francophone.
- **Besoins** : maîtriser le budget, suivre les tâches, gérer les invités, coordonner les proches, trouver des prestataires de confiance.
- **Contexte** : plusieurs mois de préparation, plusieurs contributeurs (mariés, parents, témoins).

### 2.2 Persona B — Le prestataire (« professionnel »)

- **Qui** : entreprise ou indépendant (photographe, traiteur, DJ, salle, décoration, pâtissier, wedding planner, fleuriste).
- **Besoins** : recevoir des demandes qualifiées, présenter son offre, envoyer des devis, gérer son calendrier de réservations, échanger avec les clients.
- **Contexte** : gère plusieurs événements en parallèle, veut limiter le temps administratif.

---

## 3. Périmètre fonctionnel

Le produit se structure en **trois zones** :

1. **Zone publique** — vitrine, découverte des prestataires, inscription/connexion.
2. **Espace Familles** (`/dashboard`) — l'organisation de l'événement.
3. **Espace Prestataires** (`/pro`) — la gestion de l'activité pro.

### 3.1 Zone publique

| Fonction | Description |
|----------|-------------|
| Page d'accueil | Présentation de la promesse, types d'événements, prestataires en vedette, fonctionnement |
| Découverte prestataires (`/prestataires`) | Liste **et carte interactive** (Leaflet + OpenStreetMap), filtres (catégorie, ville, langue, budget) |
| Fiche prestataire (`/prestataires/[id]`) | Profil public : présentation, tarifs, book, langues, avis vérifiés |
| Inscription (`/creer`) | Assistant multi-étapes : famille (compte → événement → détails → équipe → résumé) ou pro (compte → profil → résumé) |
| Connexion (`/auth`) | Email / mot de passe + Google, avec sélection du profil |

> **Règle de centralisation** : les popups de la carte n'affichent que nom, catégorie et un lien « Voir le profil » Misstice — aucun téléphone, lien externe ou avis tiers.

### 3.2 Espace Familles (`/dashboard`)

| Module | Fonctionnalités attendues |
|--------|---------------------------|
| **Vue d'ensemble** | Synthèse : progression globale, budget, invités, prestataires, checklist, agenda |
| **Budget** | Budget prévisionnel par catégorie, saisie des dépenses, suivi dépensé/restant, répartition visuelle |
| **Checklist** | Tâches avec responsable et échéance, statut fait/à faire, progression |
| **Invités** | Liste des invités, groupes, statuts (confirmé/en attente/décliné), régime alimentaire, +1, coordonnées |
| **Équipe** | Membres (rôle, avatar), suivi des tâches par personne, journal d'activité, invitations |
| **Planning** | Déroulé de la journée (moments horodatés, lieux, intervenants, prestataires) |
| **Agenda** | Rendez-vous / appels avec les prestataires (mode appel ou visio) |
| **Prestataires** | Prestataires réservés/sélectionnés, statut (confirmé, en attente, devis reçu), prix |
| **Inspiration** | Moodboard : idées par catégorie, tags, likes, sources (Pinterest, TikTok, Instagram, upload) |

### 3.3 Espace Prestataires (`/pro`)

| Module | Fonctionnalités attendues |
|--------|---------------------------|
| **Tableau de bord** | Synthèse : demandes récentes, devis en attente, appels à venir, statistiques clés |
| **Profil** | Vitrine : présentation, catégorie, ville, langues, formules/tarifs, photos (book) |
| **Demandes** | Demandes reçues (événement, date, invités, budget, message), statuts (nouvelle, devis envoyé, acceptée, refusée) |
| **Devis** | Création et suivi des devis (client, montant, statut : envoyé, accepté, refusé, expiré) |
| **Messagerie** | Conversations avec les familles, messages en temps réel, non-lus |
| **Calendrier** | Dates réservées / en attente, disponibilités |
| **Statistiques** | Vues, demandes, taux de réponse, évolution mensuelle |

---

## 4. Spécifications techniques

### 4.1 Stack

| Couche | Technologie |
|--------|-------------|
| Framework | **Next.js 14** (App Router) + **React 18** + **TypeScript** |
| Styles | **Tailwind CSS 3.4** (design system centralisé) |
| Icônes | lucide-react |
| Carte | Leaflet 1.9 + tuiles OpenStreetMap (sans token) |
| Backend / BDD | **Supabase** — PostgreSQL, Auth, Storage, Realtime |
| Sécurité données | Row Level Security (RLS) PostgreSQL |
| Hébergement | Vercel (recommandé) ; compatible tout hébergeur Node |

### 4.2 Architecture

- **Rendu** : Server Components pour la lecture de données (sécurisé, SEO), Client Components pour l'interactivité.
- **Authentification** : Supabase Auth (email/mot de passe + OAuth Google), session gérée par cookies via `@supabase/ssr`, rafraîchie par un middleware.
- **Protection des routes** : `/dashboard` et `/pro` inaccessibles sans session (middleware + garde au niveau des layouts).
- **Isolation des données** : chaque utilisateur n'accède qu'à ses propres données (RLS sur toutes les tables ; un événement est visible par son propriétaire et les membres invités).

### 4.3 Modèle de données

| Table | Rôle | Champs clés |
|-------|------|-------------|
| `profiles` | Extension du compte (nom, rôle) | id, full_name, role (particulier/prestataire) |
| `vendor_profiles` | Fiche prestataire | id, company, category, city, about |
| `events` | Événement organisé | id, owner_id, name, type, event_date, budget_total, guest_count |
| `event_members` | Équipe / collaborateurs | id, event_id, email, role, user_id, status |
| `budget_categories` | Postes de budget | id, event_id, name, budget, color, position |
| `budget_expenses` | Dépenses saisies | id, category_id, event_id, label, amount |

**Tables à créer pour les modules à venir** : `guests` (invités), `tasks` (checklist), `planning_moments`, `agenda_calls`, `inspiration_ideas`, `event_vendors` (prestataires réservés), `vendor_requests` (demandes), `quotes` (devis), `conversations` / `messages` (messagerie).

**Automatismes en place** :
- Création automatique du profil à l'inscription (trigger sur `auth.users`).
- Génération automatique des 10 catégories de budget par défaut à la création d'un événement (trigger sur `events`).

### 4.4 Sécurité & conformité

- **RLS activé** sur toutes les tables : accès restreint au propriétaire / membre.
- **Secrets** : clés `service_role` jamais exposées côté client ; seules les clés publiques (`anon`) sont utilisées dans le navigateur.
- **RGPD** : consentement, droit à l'effacement (suppression de compte en cascade déjà supportée), données hébergées en Europe (région Supabase à sélectionner).
- **Confirmation d'email** activée en production.

---

## 5. Contraintes & exigences non-fonctionnelles

### 5.1 Charte graphique

**Couleurs**

| Rôle | Token | Hex |
|------|-------|-----|
| Primaire (action) | violet | `#6C3CE1` (dark `#5A2FC4`, soft `#F1ECFD`) |
| Accent festif | festif | `#FF8C42` (soft `#FFF1E6`) |
| Succès | emerald | `#10B981` (soft `#E7F8F1`) |
| Fond clair | cream | `#FAFAF9` (jamais de blanc pur) |
| Fond sombre | ink | `#1E1B2E` |
| Texte principal | plum | `#1A1A2E` |
| Texte secondaire | slate | `#6B7280` |

> Aucune couleur en dur dans les composants : uniquement via les tokens Tailwind.

**Typographie**

- **Titres** : Playfair Display (serif éditoriale) — classe `font-display`.
- **Corps** : DM Sans (sans-serif) — classe `font-sans`.

**Animations** : système centralisé (`animations.css`) — apparitions, cascade (stagger), reveal au scroll, zoom/flip au survol. **Respect de `prefers-reduced-motion`**.

### 5.2 Autres exigences

| Exigence | Cible |
|----------|-------|
| Responsive | Mobile-first, du smartphone au desktop |
| Accessibilité | Focus visible, labels ARIA, contrastes suffisants, motion réduit respecté |
| SEO | Métadonnées Open Graph, langue `fr`, rendu serveur |
| Performance | Pages légères, images optimisées, chargement dynamique de la carte |
| Internationalisation | Français — France uniquement (langues prestataires : FR, EN, Espagnol, Arabe, Italien, Allemand) |

---

## 6. État d'avancement

### 6.1 ✅ Réalisé (socle opérationnel)

- Interface complète et navigable des trois zones (maquette haute-fidélité).
- **Authentification réelle** : inscription (famille & pro), connexion, déconnexion, protection des espaces privés.
- **Base de données Supabase** : schéma, RLS, triggers.
- **Création d'événement persistée** (type, date, budget, invités, équipe).
- **Module Budget complet** : catégories, budgets et dépenses enregistrés en base, suivi recalculé.
- Tableau de bord branché sur le vrai événement.

### 6.2 🔜 À réaliser (données encore de démonstration)

- Modules Familles : Checklist, Invités (détail), Équipe, Planning, Agenda, Inspiration, Prestataires réservés.
- Espace Pro complet : Demandes, Devis, Messagerie, Calendrier, Statistiques, édition du Profil/book.
- **Uploads réels** (book pro, moodboard) → Supabase Storage.
- **Emails** (invitations d'équipe, demandes de devis) → service d'email transactionnel.
- **Messagerie temps réel** → Supabase Realtime.
- Recherche/annuaire prestataires branché sur la base (aujourd'hui données statiques).

---

## 7. Trajectoire de livraison (phases)

| Phase | Contenu | État |
|-------|---------|------|
| **P0 — Socle** | Auth + BDD + RLS + module Budget | ✅ Fait |
| **P1 — Cœur Familles** | Invités, Checklist, Équipe (persistés + emails d'invitation) | À venir |
| **P2 — Prestataires** | Annuaire réel + fiche + demandes de devis | À venir |
| **P3 — Relation** | Devis, messagerie temps réel, agenda partagé | À venir |
| **P4 — Enrichissement** | Planning, Inspiration + uploads, statistiques pro | À venir |
| **P5 — Production** | Confirmation email, RGPD, paiements éventuels, déploiement Vercel | À venir |

---

## 8. Livrables

- Application web Next.js déployable (dépôt Git).
- Base de données Supabase configurée (schéma versionné dans `supabase/schema.sql`).
- Documentation : `README.md`, guide de configuration `SETUP.md`, présent cahier des charges.
- Charte graphique intégrée (design tokens Tailwind).

---

## 9. Points ouverts / à décider

- **Modèle économique** : commission sur réservation ? abonnement pro ? (mention « vous ne payez que les prestataires réservés » sur la page d'inscription).
- **Paiements en ligne** : intégration (Stripe ?) pour acomptes/réservations — hors périmètre actuel.
- **Modération** : validation des fiches prestataires (badge « vérifié par Misstice »).
- **Notifications** : email uniquement, ou aussi push/temps réel ?
- **Application mobile** native : envisagée ou web responsive suffisant ?

---

*Document de travail — à faire évoluer avec le produit.*
