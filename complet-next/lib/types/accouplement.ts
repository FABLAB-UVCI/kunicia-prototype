import { NiveauAlerte, StatutAccouplement } from "./enums";

export interface Accouplement {
  id: string;
  maleId: string;
  femelleId: string;
  dateAccouplement: string;
  coefficientParente: number;
  typeParente: string | null;
  statut: StatutAccouplement;
  motifValidationForcee: string | null;
  createdAt: string;
  niveauAlerte: NiveauAlerte;
}

export interface AccouplementListItem extends Accouplement {
  male: { id: string; codeIdentification: string; nom: string | null; race: string };
  femelle: { id: string; codeIdentification: string; nom: string | null; race: string };
}

export interface CreateAccouplementPayload {
  maleId: string;
  femelleId: string;
  dateAccouplement: string;
}

export interface ValiderMalgreAlertePayload {
  motif: string;
}

export interface FindAccouplementsQuery {
  statut?: StatutAccouplement;
  lapinId?: string;
}

export interface VerificationParente {
  coefficientParente: number;
  typeParente: string | null;
  niveauAlerte: NiveauAlerte;
}
