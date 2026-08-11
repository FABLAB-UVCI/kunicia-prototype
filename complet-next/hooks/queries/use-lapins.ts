"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  creerLapin,
  creerLapinsLot,
  identifierLapin,
  listerLapins,
  modifierLapin,
  obtenirLapin,
  uploaderPhotoLapin,
} from "@/lib/api/lapins";
import {
  CreateLapinPayload,
  CreateLapinsLotPayload,
  FindLapinsQuery,
  IdentifierLapinPayload,
  UpdateLapinPayload,
} from "@/lib/types/lapin";

const CLE_LAPINS = ["lapins"];

export function useLapins(query: FindLapinsQuery = {}) {
  return useQuery({
    queryKey: [...CLE_LAPINS, query],
    queryFn: () => listerLapins(query),
  });
}

export function useLapin(id: string) {
  return useQuery({
    queryKey: [...CLE_LAPINS, id],
    queryFn: () => obtenirLapin(id),
    enabled: Boolean(id),
  });
}

export function useCreerLapin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLapinPayload) => creerLapin(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_LAPINS }),
  });
}

export function useModifierLapin(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLapinPayload) => modifierLapin(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_LAPINS }),
  });
}

export function useCreerLapinsLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLapinsLotPayload) => creerLapinsLot(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_LAPINS });
      queryClient.invalidateQueries({ queryKey: ["cages"] });
    },
  });
}

export function useIdentifierLapin(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IdentifierLapinPayload) => identifierLapin(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_LAPINS }),
  });
}

export function useUploaderPhotoLapin(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photo: File) => uploaderPhotoLapin(id, photo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_LAPINS }),
  });
}
