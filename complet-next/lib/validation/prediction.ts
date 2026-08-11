import { z } from "zod";
import { nombreOptionnel } from "./helpers";

export const predictionSchema = z.object({
  lapinId: z.string().min(1, "Choisir un lapin"),
  horizonJours: nombreOptionnel,
});

export type PredictionFormInput = z.input<typeof predictionSchema>;
export type PredictionFormValues = z.output<typeof predictionSchema>;
