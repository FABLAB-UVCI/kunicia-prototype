export interface AuthUser {
  id: string;
  nom: string;
  nomFerme: string;
  email: string;
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
