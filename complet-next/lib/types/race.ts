export interface Race {
  id: string;
  nom: string;
  poidsAdulteMoyen: number | null;
  paysOrigine: string | null;
  aptitude: string | null;
  caracteristiques: string[];
  createdAt: string;
  _count: { lapins: number };
}

export interface CreateRacePayload {
  nom: string;
  poidsAdulteMoyen?: number;
  paysOrigine?: string;
  aptitude?: string;
  caracteristiques?: string[];
}

export type UpdateRacePayload = Partial<CreateRacePayload>;
