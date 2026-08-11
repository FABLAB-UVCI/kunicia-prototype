"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkeletonRows } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  useClients,
  useCreerClient,
  useSupprimerClient,
} from "@/hooks/queries/use-clients";
import { ClientFormInput, ClientFormValues, clientSchema } from "@/lib/validation/client";
import { ApiError } from "@/lib/api/client";

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const creerClient = useCreerClient();
  const supprimerClient = useSupprimerClient();
  const [erreur, setErreur] = useState<string | null>(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormInput, unknown, ClientFormValues>({
    resolver: zodResolver(clientSchema),
  });

  async function onSubmit(values: ClientFormValues) {
    setErreur(null);
    try {
      await creerClient.mutateAsync(values);
      reset();
      setAfficherFormulaire(false);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  async function supprimer(id: string) {
    try {
      await supprimerClient.mutateAsync(id);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Button size="sm" onClick={() => setAfficherFormulaire((v) => !v)}>
          {afficherFormulaire ? "Annuler" : "Nouveau client"}
        </Button>
      </div>

      {afficherFormulaire && (
        <Card>
          <CardHeader>
            <CardTitle>Nouveau client</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" autoComplete="off" {...register("nom")} />
                {errors.nom && (
                  <p className="text-sm text-destructive">{errors.nom.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="telephone">Téléphone (optionnel)</Label>
                <Input id="telephone" {...register("telephone")} />
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <Label htmlFor="adresse">Adresse (optionnel)</Label>
                <Input id="adresse" {...register("adresse")} />
              </div>
              {erreur && (
                <p className="text-sm text-destructive sm:col-span-3">{erreur}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : "Créer"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {isLoading && <SkeletonRows />}

      {!isLoading && clients && clients.length > 0 && (
        <div className="flex flex-col gap-2">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{client.nom}</p>
                <p className="text-muted-foreground">
                  {[client.telephone, client.adresse].filter(Boolean).join(" — ") ||
                    "Aucune coordonnée renseignée"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {client._count.ventes} vente{client._count.ventes > 1 ? "s" : ""}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => supprimer(client.id)}
                  disabled={supprimerClient.isPending || client._count.ventes > 0}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && clients?.length === 0 && (
        <EmptyState
          title="Aucun client enregistré"
          description="Crée ton premier client avec le bouton ci-dessus."
        />
      )}
    </div>
  );
}
