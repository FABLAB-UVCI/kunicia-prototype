import { apiFetch } from "./client";
import { CreateDepensePayload, Depense } from "../types/depense";

export function listerDepenses(): Promise<Depense[]> {
  return apiFetch<Depense[]>("/depenses");
}

export function creerDepense(payload: CreateDepensePayload): Promise<Depense> {
  return apiFetch<Depense>("/depenses", { method: "POST", body: payload });
}

export function supprimerDepense(id: string): Promise<void> {
  return apiFetch<void>(`/depenses/${id}`, { method: "DELETE" });
}
