import type { Role } from "./auth";

export interface EleveurAdmin {
  id: string;
  nom: string;
  nomFerme: string;
  email: string;
  role: Role;
  actif: boolean;
  createdAt: string;
  _count: {
    lapins: number;
    cages: number;
    ventes: number;
    clients: number;
    races: number;
  };
}
