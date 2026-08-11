"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerStatus } from "@/hooks/use-server-status";
import { setServerStatus } from "@/lib/server-status";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const INTERVALLE_RECONNEXION_MS = 5000;

export function ServerStatusBanner() {
  const enLigne = useServerStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (enLigne) return;

    // tant que le serveur est marqué injoignable, on retente périodiquement ;
    // dès qu'un ping passe, on rafraîchit tout ce qui était en cache (les
    // requêtes en erreur ou périmées se relancent automatiquement)
    const intervalle = setInterval(() => {
      fetch(API_URL)
        .then(() => {
          setServerStatus(true);
          queryClient.invalidateQueries();
        })
        .catch(() => {
          // toujours injoignable, on réessaiera au prochain tick
        });
    }, INTERVALLE_RECONNEXION_MS);

    return () => clearInterval(intervalle);
  }, [enLigne, queryClient]);

  if (enLigne) return null;

  return (
    <div className="bg-destructive px-4 py-2 text-center text-sm text-white">
      Serveur injoignable — nouvelle tentative de connexion en cours...
    </div>
  );
}
