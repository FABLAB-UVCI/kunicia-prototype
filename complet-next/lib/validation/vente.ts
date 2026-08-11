import { z } from "zod";
import { texteOptionnel } from "./helpers";

export const venteSchema = z.object({
  lapinId: z.string().min(1, "Choisir un lapin"),
  clientId: texteOptionnel,
  prix: z.coerce.number().positive("Le prix doit être positif"),
  dateVente: texteOptionnel,
});

export type VenteFormInput = z.input<typeof venteSchema>;
export type VenteFormValues = z.output<typeof venteSchema>;
