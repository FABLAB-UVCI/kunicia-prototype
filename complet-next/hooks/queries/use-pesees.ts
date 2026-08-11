"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creerPesee, listerPesees } from "@/lib/api/pesees";
import { CreatePeseePayload, FindPeseesQuery } from "@/lib/types/pesee";

const CLE_PESEES = ["pesees"];

export function usePesees(query: FindPeseesQuery = {}) {
  return useQuery({
    queryKey: [...CLE_PESEES, query],
    queryFn: () => listerPesees(query),
  });
}

export function useCreerPesee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePeseePayload) => creerPesee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_PESEES });
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
  });
}
