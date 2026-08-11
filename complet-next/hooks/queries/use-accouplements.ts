"use client";

import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  annulerAccouplement,
  creerAccouplement,
  listerAccouplements,
  obtenirAccouplement,
  validerAccouplement,
  validerAccouplementMalgreAlerte,
  verifierParente,
} from "@/lib/api/accouplements";
import {
  CreateAccouplementPayload,
  FindAccouplementsQuery,
  ValiderMalgreAlertePayload,
} from "@/lib/types/accouplement";

const CLE_ACCOUPLEMENTS = ["accouplements"];

export function useAccouplements(query: FindAccouplementsQuery = {}) {
  return useQuery({
    queryKey: [...CLE_ACCOUPLEMENTS, query],
    queryFn: () => listerAccouplements(query),
  });
}

export function useAccouplement(id: string) {
  return useQuery({
    queryKey: [...CLE_ACCOUPLEMENTS, id],
    queryFn: () => obtenirAccouplement(id),
    enabled: Boolean(id),
  });
}

export function useCreerAccouplement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccouplementPayload) => creerAccouplement(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_ACCOUPLEMENTS }),
  });
}

function invalidateAccouplementsEtLapins(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: CLE_ACCOUPLEMENTS });
  queryClient.invalidateQueries({ queryKey: ["lapins"] });
}

export function useValiderAccouplement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => validerAccouplement(id),
    onSuccess: () => invalidateAccouplementsEtLapins(queryClient),
  });
}

export function useValiderAccouplementMalgreAlerte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ValiderMalgreAlertePayload }) =>
      validerAccouplementMalgreAlerte(id, payload),
    onSuccess: () => invalidateAccouplementsEtLapins(queryClient),
  });
}

export function useAnnulerAccouplement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => annulerAccouplement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_ACCOUPLEMENTS }),
  });
}

// prévisualisation en direct dès que les deux lapins sont choisis dans le
// formulaire de création, avant de soumettre — cf. verifier-parente côté
// backend (aucun effet de bord, ne crée rien)
export function useVerifierParente(maleId: string, femelleId: string) {
  return useQuery({
    queryKey: [...CLE_ACCOUPLEMENTS, "verifier-parente", maleId, femelleId],
    queryFn: () => verifierParente(maleId, femelleId),
    enabled: Boolean(maleId) && Boolean(femelleId) && maleId !== femelleId,
  });
}
