import { z } from "zod";
import { nombreOptionnel, texteOptionnel } from "./helpers";

export const porteeSchema = z.object({
  accouplementId: z.string().min(1, "Choisir un accouplement"),
  dateNaissance: z.string().min(1, "Champ requis"),
  nombreNes: z.coerce.number().int().min(1, "Au moins 1"),
  poidsMoyenNaissance: nombreOptionnel,
});

export type PorteeFormInput = z.input<typeof porteeSchema>;
export type PorteeFormValues = z.output<typeof porteeSchema>;

export const lapinSevreSchema = z.object({
  nom: texteOptionnel,
  raceId: z.string().min(1, "Champ requis"),
  sexe: z.enum(["MALE", "FEMELLE"]),
});

export const sevrageSchema = z.object({
  dateSevrage: z.string().min(1, "Champ requis"),
  lapins: z.array(lapinSevreSchema),
});

export type SevrageFormInput = z.input<typeof sevrageSchema>;
export type SevrageFormValues = z.output<typeof sevrageSchema>;
