"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonRows } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useAccouplements } from "@/hooks/queries/use-accouplements";
import { useCreerPortee, usePortees } from "@/hooks/queries/use-portees";
import { PorteeFormInput, PorteeFormValues, porteeSchema } from "@/lib/validation/portee";
import { ApiError } from "@/lib/api/client";
import { nomAffiche } from "@/lib/format-lapin";

export default function PorteesPage() {
  const { data: portees, isLoading } = usePortees();
  const { data: accouplements } = useAccouplements();
  const creerPortee = useCreerPortee();
  const [erreur, setErreur] = useState<string | null>(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  const accouplementsAvecPorteeIds = new Set(portees?.map((p) => p.accouplementId));
  const accouplementsDisponibles = accouplements?.filter(
    (a) =>
      (a.statut === "VALIDE" || a.statut === "VALIDE_MALGRE_ALERTE") &&
      !accouplementsAvecPorteeIds.has(a.id),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PorteeFormInput, unknown, PorteeFormValues>({
    resolver: zodResolver(porteeSchema),
  });

  async function onSubmit(values: PorteeFormValues) {
    setErreur(null);
    try {
      await creerPortee.mutateAsync(values);
      reset();
      setAfficherFormulaire(false);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Reproductions</h1>
          <p className="text-sm text-muted-foreground">
            {accouplementsDisponibles?.length ?? 0} accouplement
            {(accouplementsDisponibles?.length ?? 0) > 1 ? "s" : ""} en attente
            de reproduction
          </p>
        </div>
        <Button size="sm" onClick={() => setAfficherFormulaire((v) => !v)}>
          {afficherFormulaire ? "Annuler" : "Nouvelle reproduction"}
        </Button>
      </div>

      {afficherFormulaire && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle reproduction (mise bas)</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="accouplementId">Accouplement</Label>
                <Select
                  id="accouplementId"
                  {...register("accouplementId")}
                >
                  <option value="">Choisir</option>
                  {accouplementsDisponibles?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {nomAffiche(a.male)} × {nomAffiche(a.femelle)} —{" "}
                      {new Date(a.dateAccouplement).toLocaleDateString("fr-FR")}
                    </option>
                  ))}
                </Select>
                {errors.accouplementId && (
                  <p className="text-sm text-destructive">
                    {errors.accouplementId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateNaissance">Date de naissance</Label>
                <Input id="dateNaissance" type="date" {...register("dateNaissance")} />
                {errors.dateNaissance && (
                  <p className="text-sm text-destructive">
                    {errors.dateNaissance.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nombreNes">Nombre de nés</Label>
                <Input id="nombreNes" type="number" min={1} {...register("nombreNes")} />
                {errors.nombreNes && (
                  <p className="text-sm text-destructive">{errors.nombreNes.message}</p>
                )}
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <Label htmlFor="poidsMoyenNaissance">
                  Poids moyen naissance (optionnel, kg)
                </Label>
                <Input
                  id="poidsMoyenNaissance"
                  type="number"
                  step="0.01"
                  {...register("poidsMoyenNaissance")}
                />
              </div>
              {erreur && (
                <p className="text-sm text-destructive sm:col-span-2">{erreur}</p>
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

      {!isLoading && portees && portees.length > 0 && (
        <div className="flex flex-col gap-2">
          {portees.map((portee) => (
            <Link
              key={portee.id}
              href={`/portees/${portee.id}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              <div>
                <p className="font-medium">
                  {new Date(portee.dateNaissance).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-muted-foreground">
                  {portee.nombreSevres}/{portee.nombreNes} sevrés
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {portee.dateSevrage ? "Sevrage confirmé" : "En attente de sevrage"}
              </span>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && portees?.length === 0 && (
        <EmptyState
          title="Aucune reproduction enregistrée"
          description="Enregistre une mise bas avec le bouton ci-dessus."
        />
      )}
    </div>
  );
}
