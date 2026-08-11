import { apiFetch } from "./client";
import { CreateVentePayload, Vente } from "../types/vente";

export function listerVentes(): Promise<Vente[]> {
  return apiFetch<Vente[]>("/ventes");
}

export function creerVente(payload: CreateVentePayload): Promise<Vente> {
  return apiFetch<Vente>("/ventes", { method: "POST", body: payload });
}
