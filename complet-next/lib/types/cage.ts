import { Sexe, StatutCage, StatutLapin, TypeCage } from "./enums";

export interface Cage {
  id: string;
  numero: string;
  type: TypeCage;
  qrCode: string;
  capacite: number | null;
  emplacement: string | null;
  createdAt: string;
  nombreOccupants: number;
  statut: StatutCage;
}

export interface OccupantCage {
  id: string;
  codeIdentification: string;
  nom: string | null;
  // null tant que le lapin n'est pas identifié (cf. lib/types/lapin.ts)
  race: string | null;
  sexe: Sexe | null;
  statut: StatutLapin;
  dateNaissance: string | null;
}

export interface CageDetail extends Cage {
  occupants: OccupantCage[];
}

export interface CreateCagePayload {
  numero: string;
  type: TypeCage;
  capacite?: number;
  emplacement?: string;
}

export type UpdateCagePayload = Partial<CreateCagePayload>;
