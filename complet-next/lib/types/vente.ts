export interface Vente {
  id: string;
  lapinId: string;
  clientId: string | null;
  prix: number;
  dateVente: string;
  createdAt: string;
  lapin: { id: string; codeIdentification: string; nom: string | null; race: string };
  client: { id: string; nom: string } | null;
}

export interface CreateVentePayload {
  lapinId: string;
  clientId?: string;
  prix: number;
  dateVente?: string;
}
