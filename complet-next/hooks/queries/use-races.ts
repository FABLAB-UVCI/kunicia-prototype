"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  creerRace,
  listerRaces,
  modifierRace,
  supprimerRace,
} from "@/lib/api/races";
import { CreateRacePayload, UpdateRacePayload } from "@/lib/types/race";

const CLE_RACES = ["races"];

export function useRaces() {
  return useQuery({ queryKey: CLE_RACES, queryFn: listerRaces });
}

export function useCreerRace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRacePayload) => creerRace(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_RACES }),
  });
}

export function useModifierRace(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRacePayload) => modifierRace(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_RACES }),
  });
}

export function useSupprimerRace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerRace(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_RACES }),
  });
}
