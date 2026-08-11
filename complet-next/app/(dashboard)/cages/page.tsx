"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { SkeletonCardGrid } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useCages, useCreerCage } from "@/hooks/queries/use-cages";
import { CageFormInput, CageFormValues, cageSchema } from "@/lib/validation/cage";
import { ApiError } from "@/lib/api/client";
import { LABEL_STATUT_CAGE, TONE_STATUT_CAGE } from "@/lib/labels";

export default function CagesPage() {
  const { data: cages, isLoading } = useCages();
  const creerCage = useCreerCage();
  const [erreur, setErreur] = useState<string | null>(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CageFormInput, unknown, CageFormValues>({
    resolver: zodResolver(cageSchema),
  });

  async function onSubmit(values: CageFormValues) {
    setErreur(null);
    try {
      await creerCage.mutateAsync(values);
      reset();
      setAfficherFormulaire(false);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Clapiers</h1>
        <Button size="sm" onClick={() => setAfficherFormulaire((v) => !v)}>
          {afficherFormulaire ? "Annuler" : "Nouveau clapier"}
        </Button>
      </div>

      {afficherFormulaire && (
        <Card>
          <CardHeader>
            <CardTitle>Nouveau clapier</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="numero">Numéro</Label>
                <Input
                  id="numero"
                  placeholder="C-01"
                  autoComplete="off"
                  {...register("numero")}
                />
                {errors.numero && (
                  <p className="text-sm text-destructive">{errors.numero.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type">Type</Label>
                <Select
                  id="type"
                  {...register("type")}
                >
                  <option value="INDIVIDUELLE">Individuel</option>
                  <option value="COLLECTIVE">Collectif</option>
                  <option value="NID">Nid</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="capacite">Capacité (optionnel)</Label>
                <Input id="capacite" type="number" min={1} {...register("capacite")} />
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <Label htmlFor="emplacement">Emplacement (optionnel)</Label>
                <Input id="emplacement" {...register("emplacement")} />
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

      {isLoading && <SkeletonCardGrid />}

      {!isLoading && cages && cages.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cages.map((cage) => (
            <Link key={cage.id} href={`/cages/${cage.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{cage.numero}</CardTitle>
                    <StatusBadge
                      label={LABEL_STATUT_CAGE[cage.statut]}
                      tone={TONE_STATUT_CAGE[cage.statut]}
                    />
                  </div>
                  <CardDescription>
                    {cage.emplacement ?? "Emplacement non renseigné"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {cage.nombreOccupants} occupant{cage.nombreOccupants > 1 ? "s" : ""}
                    {cage.capacite ? ` / ${cage.capacite}` : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && cages?.length === 0 && (
        <EmptyState
          title="Aucun clapier enregistré"
          description="Crée ton premier clapier avec le bouton ci-dessus."
        />
      )}
    </div>
  );
}
