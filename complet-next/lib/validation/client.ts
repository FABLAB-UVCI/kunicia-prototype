import { z } from "zod";
import { texteOptionnel } from "./helpers";

export const clientSchema = z.object({
  nom: z.string().min(1, "Champ requis"),
  telephone: texteOptionnel,
  adresse: texteOptionnel,
});

export type ClientFormInput = z.input<typeof clientSchema>;
export type ClientFormValues = z.output<typeof clientSchema>;
