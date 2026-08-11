"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creerVente, listerVentes } from "@/lib/api/ventes";
import { CreateVentePayload } from "@/lib/types/vente";

const CLE_VENTES = ["ventes"];

export function useVentes() {
  return useQuery({ queryKey: CLE_VENTES, queryFn: listerVentes });
}

export function useCreerVente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVentePayload) => creerVente(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_VENTES });
      // la vente change le statut du lapin (-> VENDU) et le retire de sa cage
      queryClient.invalidateQueries({ queryKey: ["lapins"] });
      queryClient.invalidateQueries({ queryKey: ["cages"] });
    },
  });
}
