import { TypeMouvement } from "./enums";

export interface MouvementLapin {
  id: string;
  lapinId: string;
  cageId: string | null;
  typeMouvement: TypeMouvement;
  dateMouvement: string;
  commentaire: string | null;
}

export interface MouvementCree extends MouvementLapin {
  alerteCapacite: boolean;
}

export interface CreateMouvementPayload {
  lapinId: string;
  typeMouvement: TypeMouvement;
  cageId?: string;
  commentaire?: string;
}

export interface FindMouvementsQuery {
  lapinId?: string;
  cageId?: string;
  typeMouvement?: TypeMouvement;
}
