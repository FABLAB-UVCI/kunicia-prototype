# Refonte du projet Kunicia

## Objectif
La plateforme actuelle couvre une grande partie des besoins métiers de l’élevage cunicole : lapins, cages, portées, pesées, santé, ventes, finance, prédictions et authentification. La refonte vise à améliorer la cohérence technique, les flux métier et l’ergonomie pour une utilisation plus durable et plus facile à maintenir.

## Diagnostic constaté

- L’architecture est déjà organisée en trois sous-projets indépendants : backend NestJS, frontend Next.js et ml-service FastAPI.
- Les modules métier du backend sont nombreux mais leur organisation est très orientée par entité ; il manque encore un niveau de services et de use cases partagés, notamment pour les opérations transverses.
- Le frontend est organisé par groupes de routes, mais l’expérience utilisateur peut être améliorée avec une navigation plus logique, des écrans de synthèse et des composants réutilisables centrés sur les décisions d’exploitation.
- La prédiction de poids dépend d’un service séparé et doit être traitée comme un composant d’orchestration métier plutôt que comme un simple appel “à la volée”.

## Architecture cible

### 1. Domaine fonctionnel
Créer un modèle métier partagé avec 6 zones de responsabilité :

- Gestion des lapins et des portées
- Gestion des cages et des mouvements
- Gestion des opérations d’alimentation/santé
- Gestion commerciale et financière
- Analyse prédictive et dashboards
- Authentification et sécurité

Chaque zone doit exposer un “service métier” dédié, un DTO de sortie propre, et une interface de données nettoyée.

### 2. API backend
Le backend doit évoluer vers une structure plus lisible :

- src/modules/<domain>/controllers
- src/modules/<domain>/services
- src/modules/<domain>/dto
- src/modules/<domain>/validators
- src/modules/<domain>/mappers

Pour chaque module, les responsabilités doivent être séparées :

- Controller → transport HTTP
- Service → logique métier
- Prisma repository/service → accès aux données
- DTO → validation des entrées/sorties
- Utilitaires → transformations et formatage

### 3. Frontend
Le frontend devra afficher une expérience orientée “operateur” :

- Un dashboard de synthèse avec KPI métier
- Une navigation latérale cohérente par fonctionnalités
- Un moteur de filtres réutilisable
- Des formulaires standardisés
- Des écrans d’erreurs et de chargement homogènes

Les hooks React Query doivent être normalisés autour d’un contrat uniforme :

- query key
- payload de réponse
- mutation side effects
- invalidate des dépendances

### 4. ML service
Le service de prédiction doit devenir un composant métier “isolationné”, avec un contrat d’API stable et un contrat de sortie normalisé.

## Roadmap de refonte

### Phase 1 — Gouvernance
- Rédiger les conventions de code pour le backend et le frontend.
- Standardiser les noms des modules et des routes.
- Introduire des DTO de réponse cohérents.

### Phase 2 — UX
- Revoir l’interface globale de navigation.
- Ajouter un tableau de bord d’information.
- Créer une identité visuelle cohérente pour les pages métier.

### Phase 3 — Dépendances et API
- Centraliser les appels API côté frontend.
- Ajouter un client API partagé et des erreurs normalisées.
- Préparer des évolutions de sécurité et de validation.

### Phase 4 — Qualité
- Ajouter des tests de contrat API.
- Mettre en place une couverture de tests sur les services métier.
- Supprimer les points de duplication dans les composants et les hooks.

## Plan de mise en œuvre immédiate

1. Structurer l’API par use-case plutôt que par simple table Prisma.
2. Unifier les réponses de l’API en objets standards.
3. Réduire le nombre de composants front trop spécifiques.
4. Créer une charte graphique et navigation de manière progressive.
5. Connecter l’interface aux modules métier avec des API types et testables.

## Faisabilité
La refonte est bien réalisable car le projet est déjà découpé en sous-projets de manière saine. Le travail de fond consiste surtout à convertir cette complexité métier en conventions plus fiables et en composants plus réutilisables, sans repartir à zéro.
