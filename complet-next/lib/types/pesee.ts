export interface Pesee {
  id: string;
  lapinId: string;
  date: string;
  poids: number;
}

export interface CreatePeseePayload {
  lapinId: string;
  poids: number;
  date?: string;
}

export interface FindPeseesQuery {
  lapinId?: string;
}
