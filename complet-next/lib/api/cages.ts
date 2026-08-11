import { apiFetch } from "./client";
import { Cage, CageDetail, CreateCagePayload, UpdateCagePayload } from "../types/cage";

export function listerCages(): Promise<Cage[]> {
  return apiFetch<Cage[]>("/cages");
}

export function obtenirCage(id: string): Promise<CageDetail> {
  return apiFetch<CageDetail>(`/cages/${id}`);
}

export function creerCage(payload: CreateCagePayload): Promise<Cage> {
  return apiFetch<Cage>("/cages", { method: "POST", body: payload });
}

export function modifierCage(id: string, payload: UpdateCagePayload): Promise<Cage> {
  return apiFetch<Cage>(`/cages/${id}`, { method: "PATCH", body: payload });
}

export function supprimerCage(id: string): Promise<void> {
  return apiFetch<void>(`/cages/${id}`, { method: "DELETE" });
}
