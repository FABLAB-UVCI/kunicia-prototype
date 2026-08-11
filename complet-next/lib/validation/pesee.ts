import { z } from "zod";
import { texteOptionnel } from "./helpers";

export const peseeSchema = z.object({
  lapinId: z.string().min(1, "Choisir un lapin"),
  // plage plausible pour un lapin — cf. backend/create-pesee.dto.ts, sert
  // surtout à intercepter une erreur de saisie évidente (ex. "80" au lieu de
  // "0.8"), pas à contraindre l'élevage
  poids: z.coerce
    .number()
    .min(0.02, "Poids trop faible (minimum 0,02 kg)")
    .max(10, "Poids trop élevé (maximum 10 kg)"),
  // un <input type="date"> vide envoie "" (pas undefined) — sans ce
  // préprocesseur, "" passe la validation zod côté front mais fait échouer
  // @IsDateString() côté backend (qui attend soit une vraie date, soit rien)
  date: texteOptionnel,
});

export type PeseeFormInput = z.input<typeof peseeSchema>;
export type PeseeFormValues = z.output<typeof peseeSchema>;
