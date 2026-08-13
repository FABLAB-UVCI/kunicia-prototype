"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Shield, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonRows } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import {
  useEleveurs,
  useModifierActifEleveur,
} from "@/hooks/queries/use-administration";
import { ApiError } from "@/lib/api/client";

export default function AdminPage() {
  const router = useRouter();
  const { utilisateur } = useAuth();
  const { data: eleveurs, isLoading } = useEleveurs();
  const modifierActif = useModifierActifEleveur();
  const [erreur, setErreur] = useState<string | null>(null);

  // garde côté client : seul un ADMIN accède à cette page (les routes API
  // sont, elles, protégées par exigerAdmin)
  useEffect(() => {
    if (utilisateur && utilisateur.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [utilisateur, router]);

  async function basculerActif(id: string, actifActuel: boolean) {
    setErreur(null);
    try {
      await modifierActif.mutateAsync({ id, actif: !actifActuel });
    } catch (error) {
      setErreur(
        error instanceof ApiError ? error.message : "Une erreur est survenue",
      );
    }
  }

  if (utilisateur && utilisateur.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Éleveurs inscrits</h1>
      </div>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      {isLoading && <SkeletonRows />}

      {!isLoading && eleveurs && eleveurs.length > 0 && (
        <div className="flex flex-col gap-2">
          {eleveurs.map((eleveur) => {
            const estMoi = eleveur.id === utilisateur?.id;
            const estAdmin = eleveur.role === "ADMIN";
            return (
              <div
                key={eleveur.id}
                className="flex flex-col gap-3 rounded-lg border px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {eleveur.nomFerme}
                      {eleveur.nom !== eleveur.nomFerme && (
                        <span className="text-muted-foreground">
                          {" "}
                          — {eleveur.nom}
                        </span>
                      )}
                    </span>
                    {estAdmin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <Shield className="size-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <UserRound className="size-3" />
                        Éleveur
                      </span>
                    )}
                    {!eleveur.actif && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Désactivé
                      </span>
                    )}
                  </div>
                  <p className="truncate text-muted-foreground">{eleveur.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Inscrit le{" "}
                    {format(new Date(eleveur.createdAt), "dd/MM/yyyy", {
                      locale: fr,
                    })}{" "}
                    — {eleveur._count.lapins} lapins, {eleveur._count.cages}{" "}
                    clapiers, {eleveur._count.ventes} ventes,{" "}
                    {eleveur._count.clients} clients, {eleveur._count.races} races
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={eleveur.actif ? "outline" : "default"}
                  onClick={() => basculerActif(eleveur.id, eleveur.actif)}
                  disabled={estMoi || modifierActif.isPending}
                  title={estMoi ? "Vous ne pouvez pas modifier votre propre compte" : undefined}
                >
                  {eleveur.actif ? "Désactiver" : "Activer"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && eleveurs?.length === 0 && (
        <EmptyState
          title="Aucun éleveur inscrit"
          description="Les comptes créés apparaîtront ici."
        />
      )}
    </div>
  );
}
