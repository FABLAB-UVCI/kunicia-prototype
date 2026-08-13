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

export interface StatistiquesAdmin {
  eleveurs: { total: number; actifs: number; desactives: number; admins: number };
  lapins: { total: number; males: number; femelles: number };
  cages: number;
  races: number;
  clients: number;
  ventes: { nombre: number; chiffreAffaires: number };
  pesees: number;
  portees: number;
  predictions: number;
  depenses: { nombre: number; total: number };
  inscriptionsParMois: { mois: string; total: number }[];
}
