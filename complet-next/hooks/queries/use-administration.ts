"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listerEleveurs, modifierActifEleveur } from "@/lib/api/admin";

const CLE_ELEVEURS = ["admin", "eleveurs"];

export function useEleveurs() {
  return useQuery({ queryKey: CLE_ELEVEURS, queryFn: listerEleveurs });
}

export function useModifierActifEleveur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) =>
      modifierActifEleveur(id, actif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_ELEVEURS }),
  });
}
