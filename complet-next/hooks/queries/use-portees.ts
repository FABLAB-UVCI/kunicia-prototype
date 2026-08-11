"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmerSevrage,
  creerPortee,
  listerPortees,
  obtenirPortee,
} from "@/lib/api/portees";
import {
  ConfirmerSevragePayload,
  CreatePorteePayload,
  FindPorteesQuery,
} from "@/lib/types/portee";

const CLE_PORTEES = ["portees"];

export function usePortees(query: FindPorteesQuery = {}) {
  return useQuery({
    queryKey: [...CLE_PORTEES, query],
    queryFn: () => listerPortees(query),
  });
}

export function usePortee(id: string) {
  return useQuery({
    queryKey: [...CLE_PORTEES, id],
    queryFn: () => obtenirPortee(id),
    enabled: Boolean(id),
  });
}

export function useCreerPortee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePorteePayload) => creerPortee(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_PORTEES }),
  });
}

export function useConfirmerSevrage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConfirmerSevragePayload) => confirmerSevrage(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_PORTEES });
      queryClient.invalidateQueries({ queryKey: ["lapins"] });
    },
  });
}
