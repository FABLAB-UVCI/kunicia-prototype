# ============================================================
# complet-next — Kunicia (Next.js full-stack, port 3000)
# Multi-stage : npm ci + prisma generate + next build
# (output standalone), puis runtime léger + CLI prisma pour
# migrate + seed automatiques au démarrage.
#
# Registre : registry.yarnpkg.com (cf. .npmrc embarqué dans l'image) — c'est
# le seul registre rapide et fiable sur le builder Voisilab : npmjs.org y est
# bloqué (délai de build dépassé) et npmmirror y est trop lent. La recette
# vient du projet de référence succes-gmdi. package-lock.json (URL npmjs.org)
# est committé pour un `npm ci` déterministe ; npm réécrit automatiquement le
# registre vers yarnpkg au moment de l'install.
# ============================================================

# ---------- Étape 1 : build ----------
FROM node:24-alpine AS build
WORKDIR /app

ENV CI=true
ENV NODE_OPTIONS=--max-old-space-size=4096

# placeholder requis par prisma generate (prisma.config.ts lit DATABASE_URL) ;
# aucune vraie URL n'est au build (.env exclu) — l'URL réelle vient des
# variables d'environnement Voisilab au runtime uniquement.
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

# NEXT_PUBLIC_* sont inlinées dans le bundle au build :
#  - NEXT_PUBLIC_API_URL=/api (le Next sert lui-même son API)
#  - NEXT_PUBLIC_APP_URL = origine publique encodée dans les QR cages
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY .npmrc package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# client Prisma généré localement (lib/generated, gitignoré → généré ici)
RUN npx prisma generate
RUN npm run build

# ---------- Étape 2 : runtime ----------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# application autonome (server.js + node_modules tracés)
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# schéma + config + client Prisma pour les commandes migrate/seed
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/lib/generated ./lib/generated

# CLI prisma (devDependency absente du standalone) — install npm réalisée
# dans un prefix séparé puis copiée à plat (layout npm réel, pas de symlinks
# pnpm) ; ne touche pas au node_modules tracé du standalone.
RUN npm install --prefix /opt/prisma-tools --no-save --registry=https://registry.yarnpkg.com prisma@7.9.1 \
  && cp -a /opt/prisma-tools/node_modules/. /app/node_modules/

# migrate + seed en ARRIÈRE-PLAN : le serveur doit écouter sur $PORT dans les
# 40 s du healthcheck Voisilab, sinon le conteneur est tué. Le migrate deploy
# est réessayé (DB éventuellement lente à démarrer) ; le seed est idempotent
# (recrée uniquement les données du compte de démo). Le serveur Next démarre
# en parallèle et répond au probe ; les données sont prêtes quelques secondes
# après (visible dans les logs : "==> migrate+seed OK").
CMD ["sh", "-c", "(echo '==> migrate deploy (arriere-plan)'; until node /app/node_modules/prisma/build/index.js migrate deploy; do echo '==> DB pas prete, nouvelle tentative dans 5s'; sleep 5; done && echo '==> seed' && node --import ./prisma/resolve-typescript.mjs prisma/seed.ts && echo '==> migrate+seed OK') & node server.js"]
