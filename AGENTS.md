# Kunicia — plateforme d'élevage cunicole (monorepo)

Prototype à trois sous-projets **indépendants** (chacun son `pnpm-workspace.yaml`, son lockfile, son `node_modules`). Il n'y a PAS de package.json à la racine.

| Service | Stack | Port |
|---|---|---|
| `backend/` | NestJS 11 + Prisma 7 + PostgreSQL — **legacy** : source de référence, plus utilisé à l'exécution | 3333 |
| `frontend/` | Next.js 16 (App Router) + React 19 + Tailwind 4 + React Query — **monolithe full-stack** (API + UI) | 3000 |
| `ml-service/` | FastAPI + scikit-learn (prédiction de poids) | 8000 |

## Langue

L'UI, les messages d'erreur, les commentaires et la doc sont **en français**. Les identifiants de code (DTO, enums, variables) le sont aussi (`Utilisateur`, `motDePasse`, `lapinId`…). Garder cette convention.

## Commandes rapides

```bash
# backend — LEGACY, plus utilisé à l'exécution : tous les modules ont été migrés
# vers des route handlers Next (app/api). Il reste la référence pour la logique
# métier et les tests unitaires, mais plus rien ne l'appelle au runtime.
cd backend && pnpm install && pnpm prisma generate   # nécessaire après install
pnpm start:dev                                        # Nest watch, port 3333 (inutile désormais)
pnpm test                                             # unit (rootDir=src, *.spec.ts)
pnpm lint

# frontend (aucun test, pas de typecheck script — `pnpm build` typecheck)
# sert l'UI ET l'API (app/api/*). C'est le seul service à lancer côté app.
cd frontend && pnpm install && pnpm dev
pnpm lint && pnpm build

# ml-service (venv + train auto au 1er lancement si model/modele_poids.joblib absent)
# appelé par le frontend via PYTHON_API_URL, jamais par le navigateur.
cd ml-service && ./start

# NB : le dossier deploiement/ (docker-compose + 3 Dockerfiles) a été perdu
# accidentellement — à recréer si besoin (build standalone frontend = server.js).
```

## Pièges transverses

- **Prisma 7** a changé : driver adapter obligatoire, client généré dans `frontend/lib/generated/prisma` (gitignoré — régénérer après install), config dans `frontend/prisma.config.ts`. Le backend (legacy) a le sien dans `backend/src/generated/prisma`.
- **Auth par cookie httpOnly** (pas de header Authorization) : le frontend pose/vérifie le cookie via `lib/server/auth.ts` (JWT jose), et envoie `credentials: "include"` via `lib/api/client.ts`. Un nouvel appel API doit suivre ce schéma.
- **Le frontend est l'API** : tous les modules sont des route handlers `app/api/*` servis par Next lui-même (`NEXT_PUBLIC_API_URL=/api`). Plus aucun proxy vers Nest (le rewrite `next.config.ts` a été supprimé). Ne jamais coder en dur `localhost:3333` côté navigateur.
- **ml-service ne touche jamais la DB** : seul le frontend (côté serveur, `lib/server/prediction.ts`) l'appelle via `PYTHON_API_URL` (POST `/predict`, GET `/health`). Les données d'entraînement sont **synthétiques** (`data/generate_synthetic_data.py`, courbe de Gompertz). Si `data/generate_synthetic_data.py` ou `app/features.py` change, relancer les deux commandes de génération + entraînement (voir `ml-service/README.md`).
- **Next.js 16 a des breaking changes** par rapport aux versions précédentes — lire `frontend/node_modules/next/dist/docs/` avant d'écrire du code front (voir `frontend/AGENTS.md`).
- **QR codes cages** : encodent `NEXT_PUBLIC_APP_URL`, qui doit être joignable depuis un téléphone (ngrok), jamais localhost. `.env.local`/`next.config.ts` autorisent explicitement les origines ngrok.
- **Secrets** : `backend/.env`, `frontend/.env.local`, `deploiement/.env` contiennent de vrais secrets (JWT, mot de passe DB, URL DB prod) — ne jamais les afficher ni les committer. Le `deploiement/.env` se construit depuis `.env.example`.

## Conventions & refonte en cours

- Backend organisé **par entité** : `src/modules/<entite>/{controller,service,dto,module}.ts` (ex. `prediction/`, `pesee/`, `cage/`).
- Frontend par groupes de routes `app/(dashboard)/` et `app/(auth)/`, hooks React Query dans `hooks/queries/use-*.ts`, appels API dans `lib/api/*.ts`, composants shadcn/ui dans `components/ui/`, alias `@/*`.
- **Refonte terminée** : le backend NestJS a été entièrement fusionné dans le frontend Next.js (route handlers `app/api/`, Prisma à la racine du frontend, `lib/server/<module>.ts` pour la logique métier), et le ml-service reste un service séparé. Nest n'est plus appelé au runtime — cf. `docs/refonte-projet-kunicia.md`.
