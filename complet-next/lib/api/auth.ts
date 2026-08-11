import { ApiError, apiFetch } from "./client";
import { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "../types/auth";

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function logout(): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

// la session voyage en cookie httpOnly, invisible au JavaScript de la page —
// c'est donc cet appel qui fait foi pour savoir si l'utilisateur est
// connecté, pas une lecture locale. Un 401 est l'état normal "pas connecté",
// pas une erreur à propager.
export async function moi(): Promise<AuthUser | null> {
  try {
    return await apiFetch<AuthUser>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
