import { z } from "zod";
import { texteOptionnel } from "./helpers";

export const stockSchema = z.object({
  typeAliment: z.string().min(1, "Champ requis"),
  quantiteInitiale: z.coerce.number().positive("Doit être positif"),
  dateAchat: z.string().optional(),
});

export type StockFormInput = z.input<typeof stockSchema>;
export type StockFormValues = z.output<typeof stockSchema>;

export const distributionSchema = z.object({
  stockId: z.string().min(1, "Choisir un stock"),
  cageId: texteOptionnel,
  quantiteParJour: z.coerce.number().positive("Doit être positif"),
  nombreLapins: z.coerce.number().int().min(1, "Au moins 1"),
  dateDebut: z.string().optional(),
});

export type DistributionFormInput = z.input<typeof distributionSchema>;
export type DistributionFormValues = z.output<typeof distributionSchema>;
