import { apiFetch } from "./client";
import {
  ConfirmerSevragePayload,
  CreatePorteePayload,
  FindPorteesQuery,
  PorteeDetail,
  PorteeListItem,
} from "../types/portee";
import { Lapin } from "../types/lapin";

function buildQuery(query: FindPorteesQuery): string {
  const params = new URLSearchParams();
  if (query.accouplementId) params.set("accouplementId", query.accouplementId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listerPortees(query: FindPorteesQuery = {}): Promise<PorteeListItem[]> {
  return apiFetch<PorteeListItem[]>(`/portees${buildQuery(query)}`);
}

export function obtenirPortee(id: string): Promise<PorteeDetail> {
  return apiFetch<PorteeDetail>(`/portees/${id}`);
}

export function creerPortee(payload: CreatePorteePayload): Promise<PorteeListItem> {
  return apiFetch<PorteeListItem>("/portees", { method: "POST", body: payload });
}

export function confirmerSevrage(
  id: string,
  payload: ConfirmerSevragePayload,
): Promise<Lapin[]> {
  return apiFetch<Lapin[]>(`/portees/${id}/sevrage`, { method: "POST", body: payload });
}
