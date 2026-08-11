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
import { StatusBadge } from "@/components/status-badge";
import { SkeletonCardGrid, SkeletonRows } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useLapins } from "@/hooks/queries/use-lapins";
import {
  useCreerPrediction,
  useCreerPredictionsPourCheptel,
  useDashboardPredictions,
  usePredictions,
} from "@/hooks/queries/use-predictions";
import {
  PredictionFormInput,
  PredictionFormValues,
  predictionSchema,
} from "@/lib/validation/prediction";
import { ApiError } from "@/lib/api/client";
import { nomAffiche } from "@/lib/format-lapin";

export default function PredictionsPage() {
  const { data: dashboard, isLoading: dashboardEnChargement } = useDashboardPredictions();
  const { data: predictions, isLoading: predictionsEnChargement } = usePredictions();
  const { data: lapins } = useLapins();
  const creerPrediction = useCreerPrediction();
  const creerPourCheptel = useCreerPredictionsPourCheptel();
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultatCheptel, setResultatCheptel] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PredictionFormInput, unknown, PredictionFormValues>({
    resolver: zodResolver(predictionSchema),
  });

  async function onSubmit(values: PredictionFormValues) {
    setErreur(null);
    try {
      await creerPrediction.mutateAsync(values);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  function codeLapin(lapinId: string): string {
    const lapin = lapins?.find((l) => l.id === lapinId);
    return lapin ? nomAffiche(lapin) : lapinId;
  }

  async function onCalculerCheptel() {
    setErreur(null);
    setResultatCheptel(null);
    try {
      const resultat = await creerPourCheptel.mutateAsync();
      setResultatCheptel(
        `${resultat.nombreCalculees} prédiction${resultat.nombreCalculees > 1 ? "s" : ""} calculée${
          resultat.nombreCalculees > 1 ? "s" : ""
        }` +
          (resultat.nombreIgnorees > 0
            ? `, ${resultat.nombreIgnorees} ignoré${resultat.nombreIgnorees > 1 ? "s" : ""} (historique insuffisant)`
            : "") +
          (resultat.nombreEchecs > 0
            ? `, ${resultat.nombreEchecs} échec${resultat.nombreEchecs > 1 ? "s" : ""}`
            : ""),
      );
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Prédictions</h1>

      {dashboardEnChargement ? (
        <SkeletonCardGrid count={3} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Poids total estimé</p>
            <p className="text-lg font-medium">
              {dashboard?.poidsTotalEstime.toFixed(2)} kg
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Lapins avec prédiction</p>
            <p className="text-lg font-medium">{dashboard?.nombreLapinsAvecPrediction}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Sans prédiction</p>
            <p className="text-lg font-medium">{dashboard?.nombreLapinsSansPrediction}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Écarts anormaux</p>
            <p className="text-lg font-medium">{dashboard?.nombreEcartsAnormaux ?? 0}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Calculer une prédiction</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCalculerCheptel}
            disabled={creerPourCheptel.isPending}
          >
            {creerPourCheptel.isPending
              ? "Calcul en cours..."
              : "Calculer pour tout le cheptel"}
          </Button>
        </CardHeader>
        {resultatCheptel && (
          <p className="px-6 text-sm text-muted-foreground">{resultatCheptel}</p>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lapinId">Lapin</Label>
              <Select
                id="lapinId"
                {...register("lapinId")}
              >
                <option value="">Choisir</option>
                {lapins
                  ?.filter((l) => l.identifie)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {nomAffiche(l)}
                    </option>
                  ))}
              </Select>
              {errors.lapinId && (
                <p className="text-sm text-destructive">{errors.lapinId.message}</p>
              )}
            </div>
            <div className="mb-3 flex flex-col gap-1.5">
              <Label htmlFor="horizonJours">Horizon (jours, défaut 14)</Label>
              <Input id="horizonJours" type="number" min={1} {...register("horizonJours")} />
            </div>
            {erreur && (
              <p className="text-sm text-destructive sm:col-span-3">{erreur}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Calcul..." : "Calculer"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div>
        <h2 className="mb-2 text-lg font-medium">Historique</h2>
        {predictionsEnChargement && <SkeletonRows />}

        {!predictionsEnChargement && predictions && predictions.length > 0 && (
          <div className="flex flex-col gap-2">
            {predictions.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <Link href={`/lapins/${p.lapinId}`} className="hover:underline">
                  {codeLapin(p.lapinId)}
                </Link>
                <span>Prédit : {p.poidsPredit} kg</span>
                <span>
                  Réel : {p.poidsReel !== null ? `${p.poidsReel} kg` : "en attente"}
                </span>
                {p.ecartPourcentage !== null && (
                  <span
                    className={p.ecartAnormal ? "font-medium text-destructive" : "text-muted-foreground"}
                  >
                    Écart : {p.ecartPourcentage > 0 ? "+" : ""}
                    {p.ecartPourcentage}%
                  </span>
                )}
                {p.ecartAnormal && <StatusBadge label="Écart anormal" tone="danger" />}
                <span className="text-muted-foreground">
                  Pour le {new Date(p.dateEcheance).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        )}

        {!predictionsEnChargement && predictions?.length === 0 && (
          <EmptyState
            title="Aucune prédiction calculée"
            description="Choisis un lapin ci-dessus pour lancer un premier calcul."
          />
        )}
      </div>
    </div>
  );
}
