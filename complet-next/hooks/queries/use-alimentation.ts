"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  creerDistribution,
  creerStock,
  listerDistributions,
  listerStocks,
  obtenirStock,
} from "@/lib/api/alimentation";
import {
  CreateDistributionPayload,
  CreateStockPayload,
  FindDistributionsQuery,
} from "@/lib/types/alimentation";

const CLE_STOCKS = ["stocks"];
const CLE_DISTRIBUTIONS = ["distributions"];

export function useStocks() {
  return useQuery({ queryKey: CLE_STOCKS, queryFn: listerStocks });
}

export function useStock(id: string) {
  return useQuery({
    queryKey: [...CLE_STOCKS, id],
    queryFn: () => obtenirStock(id),
    enabled: Boolean(id),
  });
}

export function useCreerStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockPayload) => creerStock(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_STOCKS }),
  });
}

export function useDistributions(query: FindDistributionsQuery = {}) {
  return useQuery({
    queryKey: [...CLE_DISTRIBUTIONS, query],
    queryFn: () => listerDistributions(query),
  });
}

export function useCreerDistribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDistributionPayload) => creerDistribution(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_DISTRIBUTIONS });
      queryClient.invalidateQueries({ queryKey: CLE_STOCKS });
    },
  });
}
