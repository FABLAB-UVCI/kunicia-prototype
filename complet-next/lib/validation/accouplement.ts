import { z } from "zod";

export const accouplementSchema = z.object({
  maleId: z.string().min(1, "Choisir un mâle"),
  femelleId: z.string().min(1, "Choisir une femelle"),
  dateAccouplement: z.string().min(1, "Champ requis"),
});

export type AccouplementFormValues = z.infer<typeof accouplementSchema>;

export const validationForceeSchema = z.object({
  motif: z.string().min(1, "Motif requis"),
});

export type ValidationForceeFormValues = z.infer<typeof validationForceeSchema>;
