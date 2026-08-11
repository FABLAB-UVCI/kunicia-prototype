import { apiFetch, apiUpload } from "./client";
import {
  CreateLapinPayload,
  CreateLapinsLotPayload,
  FindLapinsQuery,
  IdentifierLapinPayload,
  Lapin,
  LapinDetail,
  UpdateLapinPayload,
} from "../types/lapin";

function buildQuery(query: FindLapinsQuery): string {
  const params = new URLSearchParams();
  if (query.statut) params.set("statut", query.statut);
  if (query.sexe) params.set("sexe", query.sexe);
  if (query.origineExterieure !== undefined) {
    params.set("origineExterieure", String(query.origineExterieure));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listerLapins(query: FindLapinsQuery = {}): Promise<Lapin[]> {
  return apiFetch<Lapin[]>(`/lapins${buildQuery(query)}`);
}

export function obtenirLapin(id: string): Promise<LapinDetail> {
  return apiFetch<LapinDetail>(`/lapins/${id}`);
}

export function creerLapin(payload: CreateLapinPayload): Promise<Lapin> {
  return apiFetch<Lapin>("/lapins", { method: "POST", body: payload });
}

export function modifierLapin(id: string, payload: UpdateLapinPayload): Promise<Lapin> {
  return apiFetch<Lapin>(`/lapins/${id}`, { method: "PATCH", body: payload });
}

export function creerLapinsLot(payload: CreateLapinsLotPayload): Promise<Lapin[]> {
  return apiFetch<Lapin[]>("/lapins/lot", { method: "POST", body: payload });
}

export function identifierLapin(id: string, payload: IdentifierLapinPayload): Promise<Lapin> {
  return apiFetch<Lapin>(`/lapins/${id}/identifier`, { method: "PATCH", body: payload });
}

export function uploaderPhotoLapin(id: string, photo: File): Promise<Lapin> {
  const formData = new FormData();
  formData.set("photo", photo);
  return apiUpload<Lapin>(`/lapins/${id}/photo`, formData);
}
