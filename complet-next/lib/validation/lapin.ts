import { z } from "zod";
import { texteOptionnel } from "./helpers";

export const lapinSchema = z.object({
  nom: texteOptionnel,
  raceId: z.string().min(1, "Champ requis"),
  sexe: z.enum(["MALE", "FEMELLE"]),
  // un lapin acheté à l'extérieur n'a presque jamais une date de naissance
  // exacte connue de l'éleveur — on lui demande un âge approximatif, plus
  // naturel, et on en déduit une date de naissance estimée
  ageApproximatifSemaines: z.coerce.number().int().positive("Doit être positif"),
});

export type LapinFormInput = z.input<typeof lapinSchema>;
export type LapinFormValues = z.output<typeof lapinSchema>;

export const lapinEditSchema = z.object({
  nom: texteOptionnel,
  raceId: z.string().min(1, "Champ requis"),
});

export type LapinEditFormInput = z.input<typeof lapinEditSchema>;
export type LapinEditFormValues = z.output<typeof lapinEditSchema>;

// création en lot : identifiants réservés tout de suite, détails complétés
// plus tard via identifierLapinSchema (cf. lapin non identifié)
export const lapinsLotSchema = z.object({
  nombre: z.coerce.number().int().positive("Doit être positif"),
  cageId: texteOptionnel,
});

export type LapinsLotFormInput = z.input<typeof lapinsLotSchema>;
export type LapinsLotFormValues = z.output<typeof lapinsLotSchema>;

export const identifierLapinSchema = z.object({
  nom: texteOptionnel,
  raceId: z.string().min(1, "Champ requis"),
  sexe: z.enum(["MALE", "FEMELLE"]),
  ageApproximatifSemaines: z.coerce.number().int().positive("Doit être positif"),
});

export type IdentifierLapinFormInput = z.input<typeof identifierLapinSchema>;
export type IdentifierLapinFormValues = z.output<typeof identifierLapinSchema>;
