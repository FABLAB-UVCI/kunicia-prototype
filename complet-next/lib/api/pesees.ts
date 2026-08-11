import { apiFetch } from "./client";
import { CreatePeseePayload, FindPeseesQuery, Pesee } from "../types/pesee";

function buildQuery(query: FindPeseesQuery): string {
  const params = new URLSearchParams();
  if (query.lapinId) params.set("lapinId", query.lapinId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listerPesees(query: FindPeseesQuery = {}): Promise<Pesee[]> {
  return apiFetch<Pesee[]>(`/pesees${buildQuery(query)}`);
}

export function creerPesee(payload: CreatePeseePayload): Promise<Pesee> {
  return apiFetch<Pesee>("/pesees", { method: "POST", body: payload });
}
