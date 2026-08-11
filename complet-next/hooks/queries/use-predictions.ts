"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  creerPrediction,
  creerPredictionsPourCheptel,
  listerPredictions,
  obtenirDashboardPredictions,
} from "@/lib/api/predictions";
import { CreatePredictionPayload, FindPredictionsQuery } from "@/lib/types/prediction";

const CLE_PREDICTIONS = ["predictions"];

export function usePredictions(query: FindPredictionsQuery = {}) {
  return useQuery({
    queryKey: [...CLE_PREDICTIONS, query],
    queryFn: () => listerPredictions(query),
  });
}

export function useDashboardPredictions() {
  return useQuery({
    queryKey: [...CLE_PREDICTIONS, "dashboard"],
    queryFn: obtenirDashboardPredictions,
  });
}

export function useCreerPrediction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePredictionPayload) => creerPrediction(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_PREDICTIONS }),
  });
}

export function useCreerPredictionsPourCheptel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerPredictionsPourCheptel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_PREDICTIONS }),
  });
}
