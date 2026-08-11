import { z } from "zod";
import { nombreOptionnel, texteOptionnel } from "./helpers";

export const cageSchema = z.object({
  numero: z.string().min(1, "Champ requis"),
  type: z.enum(["INDIVIDUELLE", "COLLECTIVE", "NID"]),
  capacite: nombreOptionnel,
  emplacement: texteOptionnel,
});

export type CageFormInput = z.input<typeof cageSchema>;
export type CageFormValues = z.output<typeof cageSchema>;
