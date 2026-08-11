import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  motDePasse: z.string().min(8, "8 caractères minimum"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    nom: z.string().min(1, "Champ requis"),
    nomFerme: z.string().min(1, "Champ requis"),
    email: z.string().email("Adresse email invalide"),
    motDePasse: z.string().min(8, "8 caractères minimum"),
    confirmationMotDePasse: z.string().min(1, "Champ requis"),
  })
  .refine((data) => data.motDePasse === data.confirmationMotDePasse, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmationMotDePasse"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
