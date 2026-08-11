export interface Client {
  id: string;
  nom: string;
  telephone: string | null;
  adresse: string | null;
  createdAt: string;
  _count: { ventes: number };
}

export interface CreateClientPayload {
  nom: string;
  telephone?: string;
  adresse?: string;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;
