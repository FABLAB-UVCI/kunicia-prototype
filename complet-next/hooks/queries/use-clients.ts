"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  creerClient,
  listerClients,
  modifierClient,
  supprimerClient,
} from "@/lib/api/clients";
import { CreateClientPayload, UpdateClientPayload } from "@/lib/types/client";

const CLE_CLIENTS = ["clients"];

export function useClients() {
  return useQuery({ queryKey: CLE_CLIENTS, queryFn: listerClients });
}

export function useCreerClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClientPayload) => creerClient(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_CLIENTS }),
  });
}

export function useModifierClient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateClientPayload) => modifierClient(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_CLIENTS }),
  });
}

export function useSupprimerClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerClient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_CLIENTS }),
  });
}
