// Hook de résolution pour exécuter prisma/seed.ts avec `node` pur :
// le client Prisma généré est en ESM avec des imports relatifs SANS
// extension ("../enums", "./internal/class"…) — ce qui est interdit en ESM.
// Node 24 (type stripping) exige des extensions explicites : ce hook
// retente la résolution avec ".ts" quand l'import relatif échoue.
//
// Usage : node --import ./prisma/resolve-typescript.mjs prisma/seed.ts
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (cause) {
      const erreur = cause;
      const aEchoueEnModuleIntrouvable =
        erreur && typeof erreur === "object" && "code" in erreur &&
        erreur.code === "ERR_MODULE_NOT_FOUND";
      if (
        aEchoueEnModuleIntrouvable &&
        specifier.startsWith(".") &&
        !/\.[cm]?[jt]s$/.test(specifier)
      ) {
        try {
          return nextResolve(`${specifier}.ts`, context);
        } catch {
          // on remonte l'erreur d'origine si l'ajout de .ts échoue aussi
        }
      }
      throw erreur;
    }
  },
});
