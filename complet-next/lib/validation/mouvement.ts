import { z } from "zod";

export const mouvementSchema = z
  .object({
    lapinId: z.string().min(1, "Choisir un lapin"),
    typeMouvement: z.enum(["ENTREE_CAGE", "DECES", "VENTE", "CONTROLE"]),
    cageId: z.string().min(1, "Choisir une cage").optional(),
    commentaire: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.typeMouvement === "ENTREE_CAGE" && !data.cageId) {
      ctx.addIssue({
        code: "custom",
        path: ["cageId"],
        message: "La cage est requise pour une entrée en cage",
      });
    }
  });

export type MouvementFormValues = z.infer<typeof mouvementSchema>;
