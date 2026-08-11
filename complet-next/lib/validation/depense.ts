import { z } from "zod";
import { texteOptionnel } from "./helpers";

export const depenseSchema = z.object({
  categorie: z.string().min(1, "Champ requis"),
  libelle: z.string().min(1, "Champ requis"),
  montant: z.coerce.number().positive("Le montant doit être positif"),
  date: texteOptionnel,
});

export type DepenseFormInput = z.input<typeof depenseSchema>;
export type DepenseFormValues = z.output<typeof depenseSchema>;
