"use client";

import { ReactNode, createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthUser, LoginPayload, RegisterPayload } from "@/lib/types/auth";
import {
  login as loginRequest,
  logout as logoutRequest,
  moi,
  register as registerRequest,
} from "@/lib/api/auth";

const CLE_MOI = ["auth", "moi"];

interface AuthContextValue {
  utilisateur: AuthUser | null;
  estConnecte: boolean;
  // le premier appel à /auth/me est en cours : on ne sait pas encore si
  // l'utilisateur est connecté, il ne faut ni afficher le tableau de bord
  // ni rediriger vers la connexion tant que cette valeur est vraie
  chargementInitial: boolean;
  connexion: (payload: LoginPayload) => Promise<void>;
  inscription: (payload: RegisterPayload) => Promise<void>;
  deconnexion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // la session vit dans un cookie httpOnly, invisible au JavaScript de la
  // page — impossible de savoir si l'utilisateur est connecté sans demander
  // au serveur (contrairement à l'ancienne approche localStorage, lisible
  // directement et synchroniquement)
  const { data: utilisateur, isLoading } = useQuery({
    queryKey: CLE_MOI,
    queryFn: moi,
  });

  const connexion = useCallback(
    async (payload: LoginPayload) => {
      await loginRequest(payload);
      await queryClient.invalidateQueries({ queryKey: CLE_MOI });
    },
    [queryClient],
  );

  const inscription = useCallback(
    async (payload: RegisterPayload) => {
      await registerRequest(payload);
      await queryClient.invalidateQueries({ queryKey: CLE_MOI });
    },
    [queryClient],
  );

  const deconnexion = useCallback(async () => {
    await logoutRequest();
    queryClient.setQueryData(CLE_MOI, null);
    router.push("/connexion");
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      utilisateur: utilisateur ?? null,
      estConnecte: Boolean(utilisateur),
      chargementInitial: isLoading,
      connexion,
      inscription,
      deconnexion,
    }),
    [utilisateur, isLoading, connexion, inscription, deconnexion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
