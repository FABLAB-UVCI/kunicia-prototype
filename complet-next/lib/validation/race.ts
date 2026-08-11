import { z } from "zod";
import { nombreOptionnel, texteOptionnel } from "./helpers";

export const raceSchema = z.object({
  nom: z.string().min(1, "Champ requis"),
  poidsAdulteMoyen: nombreOptionnel,
  paysOrigine: texteOptionnel,
  aptitude: texteOptionnel,
  // saisi comme une chaîne séparée par des virgules dans le formulaire, puis
  // éclaté en tableau — plus simple qu'un composant de saisie de tags
  caracteristiques: z.preprocess(
    (val) =>
      typeof val === "string"
        ? val
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : val,
    z.array(z.string()).optional(),
  ),
});

export type RaceFormInput = z.input<typeof raceSchema>;
export type RaceFormValues = z.output<typeof raceSchema>;
