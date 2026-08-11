import { Sexe, StatutLapin } from "./enums";

export interface Lapin {
  id: string;
  codeIdentification: string;
  nom: string | null;
  // null = pas de photo prise, on affiche un placeholder générique
  photoUrl: string | null;
  // null tant que le lapin n'a pas été identifié (cf. `identifie`) — créé en
  // lot, oreilles pas encore marquées, fiche pas encore complétée
  race: string | null;
  raceId: string | null;
  sexe: Sexe | null;
  dateNaissance: string | null;
  statut: StatutLapin;
  identifie: boolean;
  pereId: string | null;
  mereId: string | null;
  origineExterieure: boolean;
  eleveurId: string;
  porteeId: string | null;
  cageActuelleId: string | null;
  createdAt: string;
}

export interface LapinResume {
  id: string;
  codeIdentification: string;
  nom: string | null;
  race: string | null;
}

export interface LapinDetail extends Lapin {
  pere: LapinResume | null;
  mere: LapinResume | null;
  cageActuelle: { id: string; numero: string } | null;
  portee: { id: string; dateNaissance: string } | null;
  _count: {
    pesees: number;
    enfantsPaternite: number;
    enfantsMaternite: number;
  };
  // pour une femelle : date du dernier sevrage confirmé parmi ses portées,
  // null si aucune (jamais eu de portée, ou sevrage jamais confirmé, ou lapin
  // mâle)
  dernierSevrage: string | null;
}

export interface CreateLapinPayload {
  nom?: string;
  raceId: string;
  sexe: Sexe;
  dateNaissance: string;
}

export interface UpdateLapinPayload {
  nom?: string;
  raceId?: string;
}

export interface CreateLapinsLotPayload {
  nombre: number;
  cageId?: string;
}

export interface IdentifierLapinPayload {
  nom?: string;
  raceId: string;
  sexe: Sexe;
  dateNaissance: string;
}

export interface FindLapinsQuery {
  statut?: StatutLapin;
  sexe?: Sexe;
  origineExterieure?: boolean;
}
