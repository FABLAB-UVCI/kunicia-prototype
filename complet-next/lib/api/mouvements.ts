import { apiFetch } from "./client";
import {
  CreateMouvementPayload,
  FindMouvementsQuery,
  MouvementCree,
  MouvementLapin,
} from "../types/mouvement";

function buildQuery(query: FindMouvementsQuery): string {
  const params = new URLSearchParams();
  if (query.lapinId) params.set("lapinId", query.lapinId);
  if (query.cageId) params.set("cageId", query.cageId);
  if (query.typeMouvement) params.set("typeMouvement", query.typeMouvement);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listerMouvements(
  query: FindMouvementsQuery = {},
): Promise<MouvementLapin[]> {
  return apiFetch<MouvementLapin[]>(`/mouvements${buildQuery(query)}`);
}

export function creerMouvement(payload: CreateMouvementPayload): Promise<MouvementCree> {
  return apiFetch<MouvementCree>("/mouvements", { method: "POST", body: payload });
}
