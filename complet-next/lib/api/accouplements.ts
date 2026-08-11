import { apiFetch } from "./client";
import {
  Accouplement,
  AccouplementListItem,
  CreateAccouplementPayload,
  FindAccouplementsQuery,
  ValiderMalgreAlertePayload,
  VerificationParente,
} from "../types/accouplement";

function buildQuery(query: FindAccouplementsQuery): string {
  const params = new URLSearchParams();
  if (query.statut) params.set("statut", query.statut);
  if (query.lapinId) params.set("lapinId", query.lapinId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listerAccouplements(
  query: FindAccouplementsQuery = {},
): Promise<AccouplementListItem[]> {
  return apiFetch<AccouplementListItem[]>(`/accouplements${buildQuery(query)}`);
}

export function obtenirAccouplement(id: string): Promise<Accouplement> {
  return apiFetch<Accouplement>(`/accouplements/${id}`);
}

export function creerAccouplement(
  payload: CreateAccouplementPayload,
): Promise<Accouplement> {
  return apiFetch<Accouplement>("/accouplements", { method: "POST", body: payload });
}

export function validerAccouplement(id: string): Promise<Accouplement> {
  return apiFetch<Accouplement>(`/accouplements/${id}/valider`, { method: "PATCH" });
}

export function validerAccouplementMalgreAlerte(
  id: string,
  payload: ValiderMalgreAlertePayload,
): Promise<Accouplement> {
  return apiFetch<Accouplement>(`/accouplements/${id}/valider-malgre-alerte`, {
    method: "PATCH",
    body: payload,
  });
}

export function annulerAccouplement(id: string): Promise<Accouplement> {
  return apiFetch<Accouplement>(`/accouplements/${id}/annuler`, { method: "PATCH" });
}

export function verifierParente(
  maleId: string,
  femelleId: string,
): Promise<VerificationParente> {
  const params = new URLSearchParams({ maleId, femelleId });
  return apiFetch<VerificationParente>(`/accouplements/verifier-parente?${params}`);
}
