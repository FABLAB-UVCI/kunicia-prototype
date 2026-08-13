import { apiFetch } from "./client";
import { EleveurAdmin, StatistiquesAdmin } from "../types/admin";

export function listerEleveurs(): Promise<EleveurAdmin[]> {
  return apiFetch<EleveurAdmin[]>("/admin/eleveurs");
}

export function obtenirStatsAdmin(): Promise<StatistiquesAdmin> {
  return apiFetch<StatistiquesAdmin>("/admin/stats");
}

export function modifierActifEleveur(
  id: string,
  actif: boolean,
): Promise<EleveurAdmin> {
  return apiFetch<EleveurAdmin>(`/admin/eleveurs/${id}`, {
    method: "PATCH",
    body: { actif },
  });
}
