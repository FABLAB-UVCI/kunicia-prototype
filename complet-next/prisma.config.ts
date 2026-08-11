import { defineConfig, env } from "prisma/config";

// Next.js charge automatiquement .env et .env.local au runtime, mais pas le
// CLI Prisma — on les charge donc ici pour que migrate/seed fonctionnent.
// Node ≥ 21.7 expose process.loadEnvFile (pas de dépendance dotenv) : on
// charge .env puis .env.local, le dernier chargé gagne.
try {
  process.loadEnvFile(".env");
} catch {}
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
