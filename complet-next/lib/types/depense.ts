export interface Depense {
  id: string;
  categorie: string;
  libelle: string;
  montant: number;
  date: string;
  createdAt: string;
}

export interface CreateDepensePayload {
  categorie: string;
  libelle: string;
  montant: number;
  date?: string;
}
