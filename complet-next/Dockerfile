# ============================================================
# complet-next — Kunicia (Next.js full-stack, port 3000)
# Multi-stage : pnpm install + prisma generate + next build
# (output standalone), puis runtime léger + CLI prisma pour
# migrate + seed automatiques au démarrage.
# ============================================================

# ---------- Étape 1 : build ----------
FROM node:24-alpine AS build
WORKDIR /app

ENV CI=true
ENV NODE_OPTIONS=--max-old-space-size=4096

# NEXT_PUBLIC_* sont inlinées dans le bundle au build :
#  - NEXT_PUBLIC_API_URL=/api (le Next sert lui-même son API)
#  - NEXT_PUBLIC_APP_URL = origine publique encodée dans les QR cages
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# client Prisma généré localement (lib/generated, gitignoré → généré ici)
RUN pnpm exec prisma generate
RUN pnpm build

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
RUN npm install --prefix /opt/prisma-tools --no-save prisma@7.9.1 \
  && cp -a /opt/prisma-tools/node_modules/. /app/node_modules/

# migrate + seed automatiques (ré-exécutables sans risque : le seed supprime
# puis recrée uniquement les données du compte de démo), puis serveur Next.
CMD ["sh", "-c", "node /app/node_modules/prisma/build/index.js migrate deploy && node prisma/seed.ts && node server.js"]
