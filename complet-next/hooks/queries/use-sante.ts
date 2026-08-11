"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creerSante, listerSante, modifierSante } from "@/lib/api/sante";
import { CreateSantePayload, FindSanteQuery, UpdateSantePayload } from "@/lib/types/sante";

const CLE_SANTE = ["sante"];

export function useSante(query: FindSanteQuery = {}) {
  return useQuery({
    queryKey: [...CLE_SANTE, query],
    queryFn: () => listerSante(query),
  });
}

export function useCreerSante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSantePayload) => creerSante(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_SANTE }),
  });
}

export function useModifierSante(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSantePayload) => modifierSante(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_SANTE }),
  });
}
