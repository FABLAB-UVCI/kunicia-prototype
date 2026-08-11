"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creerDepense, listerDepenses, supprimerDepense } from "@/lib/api/depenses";
import { CreateDepensePayload } from "@/lib/types/depense";

const CLE_DEPENSES = ["depenses"];

export function useDepenses() {
  return useQuery({ queryKey: CLE_DEPENSES, queryFn: listerDepenses });
}

export function useCreerDepense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDepensePayload) => creerDepense(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_DEPENSES }),
  });
}

export function useSupprimerDepense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerDepense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_DEPENSES }),
  });
}
