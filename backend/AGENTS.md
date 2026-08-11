# Backend Kunicia (NestJS 11 + Prisma 7)

## Prisma 7 : ce qui diffère des autres projets

- **Driver adapter obligatoire** : plus de moteur Rust ni d'`url` dans `schema.prisma`. Le client est instancié avec `new PrismaPg({ connectionString: process.env.DATABASE_URL })` dans `src/prisma.service.ts` (`@prisma/adapter-pg`).
- **Client généré localement** : `generator client { provider = "prisma-client" output = "../src/generated/prisma" moduleFormat = "cjs" }`. Le dossier `src/generated/prisma` est **gitignoré** → toujours `pnpm prisma generate` après `pnpm install` ou changement de schéma. Imports depuis `./generated/prisma/client` et `./generated/prisma/enums` (jamais `@prisma/client`).
- **Config hors package.json** : `prisma.config.ts` (schéma, migrations, datasource via `env("DATABASE_URL")`), lu avec `dotenv` — la DB locale est définie dans `backend/.env`, pas dans le schéma.

## Workflow schéma

`prisma/schema.prisma` (modèles en français, `Lapin`, `Pesee`, `Cage`…) → `pnpm prisma migrate dev` (crée la migration dans `prisma/migrations/`) → `pnpm prisma generate`. `prisma/seed.ts` existe (exécution non automatisée).

## Commandes

```bash
pnpm install && pnpm prisma generate   # indispensable après install/clone
pnpm start:dev                         # watch, port 3333 (PORT dans .env)
pnpm test                              # unit — rootDir=src, *.spec.ts (peu de specs à ce jour)
pnpm test:e2e                          # test/app.e2e-spec.ts — nécessite postgres + .env
pnpm lint                              # eslint --fix
pnpm build                             # typecheck + build dist/
```

## Conventions

- Modules **par entité** dans `src/modules/<entite>/{controller,service,dto,module}.ts`. La refonte cible `src/modules/<domain>/{controllers,services,dto,validators,mappers}` — cf. `docs/refonte-projet-kunicia.md`.
- **Auth en cookie httpOnly** : `auth.service.ts` pose le cookie, `JwtAuthGuard` + `CurrentUser` (décorateur `@common/decorators`) lisent le token. CORS `credentials: true` dans `src/main.ts` ; `ValidationPipe` global (`whitelist` + `forbidNonWhitelisted`).
- Les photos sont uploadées dans `uploads/` et servies statiquement sous `/uploads` (multer).
- Des skills locaux de référence Prisma 7 existent dans `.agents/skills/`, `.claude/skills/`, `.windsurf/skills/` (gitignorés) — lire leur `SKILL.md` avant de toucher à Prisma.
