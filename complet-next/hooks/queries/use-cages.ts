"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  creerCage,
  listerCages,
  modifierCage,
  obtenirCage,
  supprimerCage,
} from "@/lib/api/cages";
import { CreateCagePayload, UpdateCagePayload } from "@/lib/types/cage";

const CLE_CAGES = ["cages"];

export function useCages() {
  return useQuery({ queryKey: CLE_CAGES, queryFn: listerCages });
}

export function useCage(id: string) {
  return useQuery({
    queryKey: [...CLE_CAGES, id],
    queryFn: () => obtenirCage(id),
    enabled: Boolean(id),
  });
}

export function useCreerCage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCagePayload) => creerCage(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_CAGES }),
  });
}

export function useModifierCage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCagePayload) => modifierCage(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_CAGES }),
  });
}

export function useSupprimerCage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerCage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_CAGES }),
  });
}
