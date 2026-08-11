import { z } from "zod";
import { texteOptionnel } from "./helpers";

export const santeSchema = z.object({
  lapinId: z.string().min(1, "Choisir un lapin"),
  type: z.string().min(1, "Champ requis"),
  // un <input type="date"> vide envoie "" (pas undefined) — cf. pesee.ts
  date: texteOptionnel,
  dateRappel: texteOptionnel,
  notes: texteOptionnel,
});

export type SanteFormInput = z.input<typeof santeSchema>;
export type SanteFormValues = z.output<typeof santeSchema>;

export const santeEditSchema = z.object({
  type: z.string().min(1, "Champ requis"),
  date: texteOptionnel,
  dateRappel: texteOptionnel,
  notes: texteOptionnel,
});

export type SanteEditFormInput = z.input<typeof santeEditSchema>;
export type SanteEditFormValues = z.output<typeof santeEditSchema>;
