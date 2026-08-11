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
import { useCreerSante, useModifierSante, useSante } from "@/hooks/queries/use-sante";
import {
  SanteEditFormInput,
  SanteEditFormValues,
  santeEditSchema,
  SanteFormInput,
  SanteFormValues,
  santeSchema,
} from "@/lib/validation/sante";
import { ApiError } from "@/lib/api/client";
import { nomAffiche } from "@/lib/format-lapin";
import { Sante } from "@/lib/types/sante";

function versDateInput(date: string | null): string {
  return date ? date.slice(0, 10) : "";
}

const RAPPEL_PROCHE_JOURS = 7;

function rappelUrgent(dateRappel: string | null): boolean {
  if (!dateRappel) return false;
  const dansXJours = new Date();
  dansXJours.setDate(dansXJours.getDate() + RAPPEL_PROCHE_JOURS);
  return new Date(dateRappel) <= dansXJours;
}

function LigneSante({ suivi, libelleLapin }: { suivi: Sante; libelleLapin: string }) {
  const [enEdition, setEnEdition] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const modifierSante = useModifierSante(suivi.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SanteEditFormInput, unknown, SanteEditFormValues>({
    resolver: zodResolver(santeEditSchema),
    values: {
      type: suivi.type,
      date: versDateInput(suivi.date),
      dateRappel: versDateInput(suivi.dateRappel),
      notes: suivi.notes ?? "",
    },
  });

  async function onSubmit(values: SanteEditFormValues) {
    setErreur(null);
    try {
      await modifierSante.mutateAsync(values);
      setEnEdition(false);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  if (enEdition) {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3 rounded-lg border p-3 text-sm"
      >
        <p className="font-medium">{libelleLapin}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`type-${suivi.id}`}>Type</Label>
            <Input id={`type-${suivi.id}`} {...register("type")} />
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`date-${suivi.id}`}>Date</Label>
            <Input id={`date-${suivi.id}`} type="date" {...register("date")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`dateRappel-${suivi.id}`}>Prochain rappel</Label>
            <Input id={`dateRappel-${suivi.id}`} type="date" {...register("dateRappel")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`notes-${suivi.id}`}>Notes</Label>
            <Input id={`notes-${suivi.id}`} {...register("notes")} />
          </div>
        </div>
        {erreur && <p className="text-sm text-destructive">{erreur}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEnEdition(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">
          {libelleLapin} — {suivi.type}
        </p>
        {suivi.notes && <p className="text-xs text-muted-foreground">{suivi.notes}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right sm:items-end">
          <span className="text-muted-foreground">
            {new Date(suivi.date).toLocaleDateString("fr-FR")}
          </span>
          {suivi.dateRappel && (
            <span
              className={
                rappelUrgent(suivi.dateRappel)
                  ? "font-medium text-destructive"
                  : "text-muted-foreground"
              }
            >
              Rappel : {new Date(suivi.dateRappel).toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setEnEdition(true)}>
          Modifier
        </Button>
      </div>
    </div>
  );
}

function SanteContent() {
  const searchParams = useSearchParams();
  const lapinIdPrefilled = searchParams.get("lapinId") ?? "";

  const [lapinFiltre, setLapinFiltre] = useState(lapinIdPrefilled);
  const { data: lapins } = useLapins();
  const { data: suivis, isLoading } = useSante({ lapinId: lapinFiltre || undefined });
  const creerSante = useCreerSante();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SanteFormInput, unknown, SanteFormValues>({
    resolver: zodResolver(santeSchema),
    defaultValues: { lapinId: lapinIdPrefilled },
  });

  async function onSubmit(values: SanteFormValues) {
    setErreur(null);
    try {
      await creerSante.mutateAsync(values);
      reset({ lapinId: values.lapinId, type: "", date: undefined, dateRappel: undefined, notes: "" });
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  function lapinAffiche(lapinId: string): string {
    const lapin = lapins?.find((l) => l.id === lapinId);
    return lapin ? nomAffiche(lapin) : lapinId;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Santé</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau suivi (vaccination, soin...)</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lapinId">Lapin</Label>
              <Select id="lapinId" {...register("lapinId")}>
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
              <Label htmlFor="type">Type</Label>
              <Input id="type" placeholder="Vaccination VHD, Vermifuge..." {...register("type")} />
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Date (optionnel, défaut = maintenant)</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dateRappel">Prochain rappel (optionnel)</Label>
              <Input id="dateRappel" type="date" {...register("dateRappel")} />
            </div>
            <div className="mb-3 flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Input id="notes" {...register("notes")} />
            </div>
            {erreur && (
              <p className="text-sm text-destructive sm:col-span-2">{erreur}</p>
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

      {!isLoading && suivis && suivis.length > 0 && (
        <div className="flex flex-col gap-2">
          {suivis.map((suivi) => (
            <LigneSante
              key={suivi.id}
              suivi={suivi}
              libelleLapin={lapinAffiche(suivi.lapinId)}
            />
          ))}
        </div>
      )}

      {!isLoading && suivis?.length === 0 && (
        <EmptyState
          title="Aucun suivi santé enregistré"
          description="Ajoute une première vaccination ou un soin avec le formulaire ci-dessus."
        />
      )}
    </div>
  );
}

export default function SantePage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Chargement...</p>}>
      <SanteContent />
    </Suspense>
  );
}
