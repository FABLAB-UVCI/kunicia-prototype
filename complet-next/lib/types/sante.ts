export interface Sante {
  id: string;
  lapinId: string;
  type: string;
  date: string;
  dateRappel: string | null;
  notes: string | null;
}

export interface CreateSantePayload {
  lapinId: string;
  type: string;
  date?: string;
  dateRappel?: string;
  notes?: string;
}

export interface UpdateSantePayload {
  type?: string;
  date?: string;
  dateRappel?: string;
  notes?: string;
}

export interface FindSanteQuery {
  lapinId?: string;
}
