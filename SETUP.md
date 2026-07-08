# Configuration backend (Supabase)

Ce guide branche l'authentification et la base de données. ~10 minutes.

## 1. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → **New project** (gratuit).
2. Choisir un nom, un mot de passe de base de données et une région (Europe de préférence).
3. Attendre ~2 min que le projet soit prêt.

## 2. Créer le schéma de base de données

1. Dans le projet Supabase : menu de gauche → **SQL Editor** → **New query**.
2. Copier **tout** le contenu de [`supabase/schema.sql`](supabase/schema.sql).
3. Coller dans l'éditeur → **Run**. Un message « Success » doit apparaître.

Cela crée les tables (`profiles`, `events`, `event_members`, `budget_categories`,
`budget_expenses`, `vendor_profiles`), la sécurité par ligne (RLS) et les
déclencheurs (création automatique du profil et des catégories de budget).

## 3. Récupérer les clés API

1. Menu de gauche → **Project Settings** → **API**.
2. Copier :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (Project API keys) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Configurer l'application

1. Copier `.env.local.example` en **`.env.local`**.
2. Coller les deux valeurs de l'étape 3.
3. Redémarrer le serveur : `npm run dev`.

## 5. (Dev) Désactiver la confirmation d'email

Pour tester l'inscription sans passer par l'email de confirmation :

- **Authentication** → **Sign In / Providers** (ou **Settings**) → désactiver
  **« Confirm email »**.

Ainsi, à l'inscription, la session s'ouvre immédiatement et l'événement est créé.
En production, laissez la confirmation activée.

## 6. (Optionnel) Activer Google

Pour le bouton « Continuer avec Google » :

- **Authentication** → **Providers** → **Google** → activer et renseigner le
  Client ID / Secret (console Google Cloud). URL de redirection à autoriser :
  `http://localhost:3000/auth/callback` (et l'URL de prod).

---

## Ce qui est déjà opérationnel

- ✅ Inscription réelle (famille **et** prestataire) + création de compte
- ✅ Création d'événement persistée (type, date, budget, invités, équipe)
- ✅ Connexion / déconnexion réelles + protection des espaces `/dashboard` et `/pro`
- ✅ Tableau de bord branché sur le vrai événement
- ✅ **Module Budget complet** : dépenses et budgets par catégorie enregistrés en base

## Ce qui reste en données d'exemple (prochains modules)

Checklist, invités (détail), équipe (affichage), planning, agenda, inspiration,
et tout l'espace **pro** (demandes, devis, messagerie, calendrier, statistiques)
lisent encore des données de démonstration. Le socle (auth + DB + RLS) est en
place pour les brancher un par un sur le même modèle que le Budget.
