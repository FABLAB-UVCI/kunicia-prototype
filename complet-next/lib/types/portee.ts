import { Sexe, StatutAccouplement, StatutLapin } from "./enums";

export interface Portee {
  id: string;
  dateNaissance: string;
  nombreNes: number;
  dateSevrage: string | null;
  poidsMoyenNaissance: number | null;
  accouplementId: string;
}

export interface PorteeListItem extends Portee {
  nombreSevres: number;
}

export interface PorteeLapin {
  id: string;
  codeIdentification: string;
  nom: string | null;
  race: string;
  sexe: Sexe;
  statut: StatutLapin;
}

export interface PorteeDetail extends Portee {
  accouplement: {
    id: string;
    maleId: string;
    femelleId: string;
    dateAccouplement: string;
    coefficientParente: number;
    statut: StatutAccouplement;
    motifValidationForcee: string | null;
    createdAt: string;
    male: { id: string; codeIdentification: string; nom: string | null; race: string };
    femelle: {
      id: string;
      codeIdentification: string;
      nom: string | null;
      race: string;
      // avant le sevrage, les petits n'ont pas de fiche individuelle : ils
      // vivent avec leur mère, donc sa cage localise toute la portée
      cageActuelle: { id: string; numero: string } | null;
    };
  };
  lapins: PorteeLapin[];
}

export interface CreatePorteePayload {
  accouplementId: string;
  dateNaissance: string;
  nombreNes: number;
  poidsMoyenNaissance?: number;
}

export interface LapinSevreInput {
  nom?: string;
  raceId: string;
  sexe: Sexe;
}

export interface ConfirmerSevragePayload {
  dateSevrage: string;
  lapins: LapinSevreInput[];
}

export interface FindPorteesQuery {
  accouplementId?: string;
}
