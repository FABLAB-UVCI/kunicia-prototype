export type Role = "ADMIN" | "ELEVEUR";

export interface AuthUser {
  id: string;
  nom: string;
  nomFerme: string;
  email: string;
  role: Role;
  actif: boolean;
}

export interface RegisterPayload {
  nom: string;
  nomFerme: string;
  email: string;
  motDePasse: string;
}

export interface LoginPayload {
  email: string;
  motDePasse: string;
}

export interface AuthResponse {
  utilisateur: AuthUser;
}
