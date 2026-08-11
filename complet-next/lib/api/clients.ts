import { apiFetch } from "./client";
import { Client, CreateClientPayload, UpdateClientPayload } from "../types/client";

export function listerClients(): Promise<Client[]> {
  return apiFetch<Client[]>("/clients");
}

export function creerClient(payload: CreateClientPayload): Promise<Client> {
  return apiFetch<Client>("/clients", { method: "POST", body: payload });
}

export function modifierClient(id: string, payload: UpdateClientPayload): Promise<Client> {
  return apiFetch<Client>(`/clients/${id}`, { method: "PATCH", body: payload });
}

export function supprimerClient(id: string): Promise<void> {
  return apiFetch<void>(`/clients/${id}`, { method: "DELETE" });
}
