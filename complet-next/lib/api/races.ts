import { apiFetch } from "./client";
import { CreateRacePayload, Race, UpdateRacePayload } from "../types/race";

export function listerRaces(): Promise<Race[]> {
  return apiFetch<Race[]>("/races");
}

export function creerRace(payload: CreateRacePayload): Promise<Race> {
  return apiFetch<Race>("/races", { method: "POST", body: payload });
}

export function modifierRace(id: string, payload: UpdateRacePayload): Promise<Race> {
  return apiFetch<Race>(`/races/${id}`, { method: "PATCH", body: payload });
}

export function supprimerRace(id: string): Promise<void> {
  return apiFetch<void>(`/races/${id}`, { method: "DELETE" });
}
