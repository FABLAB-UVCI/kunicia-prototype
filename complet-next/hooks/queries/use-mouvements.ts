"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creerMouvement, listerMouvements } from "@/lib/api/mouvements";
import { CreateMouvementPayload, FindMouvementsQuery } from "@/lib/types/mouvement";

const CLE_MOUVEMENTS = ["mouvements"];

export function useMouvements(query: FindMouvementsQuery = {}) {
  return useQuery({
    queryKey: [...CLE_MOUVEMENTS, query],
    queryFn: () => listerMouvements(query),
  });
}

export function useCreerMouvement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMouvementPayload) => creerMouvement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_MOUVEMENTS });
      queryClient.invalidateQueries({ queryKey: ["lapins"] });
      queryClient.invalidateQueries({ queryKey: ["cages"] });
    },
  });
}
