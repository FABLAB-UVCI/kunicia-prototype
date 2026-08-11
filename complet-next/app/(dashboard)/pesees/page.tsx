"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonRows } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useLapins } from "@/hooks/queries/use-lapins";
import { useCreerPesee, usePesees } from "@/hooks/queries/use-pesees";
import { PeseeFormInput, PeseeFormValues, peseeSchema } from "@/lib/validation/pesee";
import { ApiError } from "@/lib/api/client";
import { nomAffiche } from "@/lib/format-lapin";

function PeseesContent() {
  const searchParams = useSearchParams();
  const lapinIdPrefilled = searchParams.get("lapinId") ?? "";

  const [lapinFiltre, setLapinFiltre] = useState(lapinIdPrefilled);
  const { data: lapins } = useLapins();
  const { data: pesees, isLoading } = usePesees({ lapinId: lapinFiltre || undefined });
  const creerPesee = useCreerPesee();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PeseeFormInput, unknown, PeseeFormValues>({
    resolver: zodResolver(peseeSchema),
    defaultValues: { lapinId: lapinIdPrefilled },
  });

  async function onSubmit(values: PeseeFormValues) {
    setErreur(null);
    try {
      await creerPesee.mutateAsync(values);
      reset({ lapinId: values.lapinId, poids: undefined, date: undefined });
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  function codeLapin(lapinId: string): string {
    const lapin = lapins?.find((l) => l.id === lapinId);
    return lapin ? nomAffiche(lapin) : lapinId;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Pesées</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle pesée</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lapinId">Lapin</Label>
              <Select
                id="lapinId"
                {...register("lapinId")}
              >
                <option value="">Choisir</option>
                {lapins?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {nomAffiche(l)}
                  </option>
                ))}
              </Select>
              {errors.lapinId && (
                <p className="text-sm text-destructive">{errors.lapinId.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="poids">Poids (kg)</Label>
              <Input id="poids" type="number" step="0.01" {...register("poids")} />
              {errors.poids && (
                <p className="text-sm text-destructive">{errors.poids.message}</p>
              )}
            </div>
            <div className="mb-3 flex flex-col gap-1.5">
              <Label htmlFor="date">Date (optionnel, défaut = maintenant)</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
            {erreur && (
              <p className="text-sm text-destructive sm:col-span-3">{erreur}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="filtreLapin">Filtrer par lapin</Label>
        <Select
          id="filtreLapin"
          value={lapinFiltre}
          onChange={(e) => setLapinFiltre(e.target.value)}
        >
          <option value="">Tous les lapins</option>
          {lapins?.map((l) => (
            <option key={l.id} value={l.id}>
              {nomAffiche(l)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <SkeletonRows />}

      {!isLoading && pesees && pesees.length > 0 && (
        <div className="flex flex-col gap-2">
          {pesees.map((pesee) => (
            <div
              key={pesee.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span>{codeLapin(pesee.lapinId)}</span>
              <span>{pesee.poids} kg</span>
              <span className="text-muted-foreground">
                {new Date(pesee.date).toLocaleDateString("fr-FR")}
              </span>
            </div>
          ))}
        </div>
      )}

      {!isLoading && pesees?.length === 0 && (
        <EmptyState
          title="Aucune pesée enregistrée"
          description="Ajoute une première pesée avec le formulaire ci-dessus."
        />
      )}
    </div>
  );
}

export default function PeseesPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Chargement...</p>}>
      <PeseesContent />
    </Suspense>
  );
}
