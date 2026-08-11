import { z } from "zod";

// convertit une chaîne vide (champ optionnel non rempli dans un <input>) en
// undefined, pour que .optional() fonctionne correctement avec react-hook-form
export const nombreOptionnel = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().optional(),
);

export const texteOptionnel = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : val),
  z.string().optional(),
);
