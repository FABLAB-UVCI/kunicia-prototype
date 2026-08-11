import { apiFetch } from "./client";
import {
  CreateSantePayload,
  FindSanteQuery,
  Sante,
  UpdateSantePayload,
} from "../types/sante";

function buildQuery(query: FindSanteQuery): string {
  const params = new URLSearchParams();
  if (query.lapinId) params.set("lapinId", query.lapinId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listerSante(query: FindSanteQuery = {}): Promise<Sante[]> {
  return apiFetch<Sante[]>(`/sante${buildQuery(query)}`);
}

export function creerSante(payload: CreateSantePayload): Promise<Sante> {
  return apiFetch<Sante>("/sante", { method: "POST", body: payload });
}

export function modifierSante(id: string, payload: UpdateSantePayload): Promise<Sante> {
  return apiFetch<Sante>(`/sante/${id}`, { method: "PATCH", body: payload });
}
