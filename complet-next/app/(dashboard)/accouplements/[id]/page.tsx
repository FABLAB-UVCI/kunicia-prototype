"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { SkeletonDetail } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useLapin } from "@/hooks/queries/use-lapins";
import {
  useAccouplement,
  useAnnulerAccouplement,
  useValiderAccouplement,
  useValiderAccouplementMalgreAlerte,
} from "@/hooks/queries/use-accouplements";
import { usePortees } from "@/hooks/queries/use-portees";
import {
  ValidationForceeFormValues,
  validationForceeSchema,
} from "@/lib/validation/accouplement";
import { ApiError } from "@/lib/api/client";
import { nomAffiche } from "@/lib/format-lapin";
import { libellePeriodeGestation } from "@/lib/format-gestation";
import {
  LABEL_NIVEAU_ALERTE,
  LABEL_STATUT_ACCOUPLEMENT,
  TONE_NIVEAU_ALERTE,
  TONE_STATUT_ACCOUPLEMENT,
} from "@/lib/labels";

export default function AccouplementDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: accouplement, isLoading } = useAccouplement(params.id);
  const { data: male } = useLapin(accouplement?.maleId ?? "");
  const { data: femelle } = useLapin(accouplement?.femelleId ?? "");
  const { data: portees } = usePortees({ accouplementId: params.id });

  const valider = useValiderAccouplement();
  const validerMalgreAlerte = useValiderAccouplementMalgreAlerte();
  const annuler = useAnnulerAccouplement();

  const [erreur, setErreur] = useState<string | null>(null);
  const [afficherMotif, setAfficherMotif] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ValidationForceeFormValues>({
    resolver: zodResolver(validationForceeSchema),
  });

  if (isLoading) return <SkeletonDetail />;
  if (!accouplement) {
    return <EmptyState title="Accouplement introuvable" />;
  }

  const enAttente = accouplement.statut === "EN_ATTENTE";

  async function onValider() {
    setErreur(null);
    try {
      await valider.mutateAsync(accouplement!.id);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  async function onValiderMalgreAlerte(values: ValidationForceeFormValues) {
    setErreur(null);
    try {
      await validerMalgreAlerte.mutateAsync({ id: accouplement!.id, payload: values });
      setAfficherMotif(false);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  async function onAnnuler() {
    setErreur(null);
    try {
      await annuler.mutateAsync(accouplement!.id);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {male ? nomAffiche(male) : "..."} × {femelle ? nomAffiche(femelle) : "..."}
          </h1>
          <p className="text-muted-foreground">
            {new Date(accouplement.dateAccouplement).toLocaleDateString("fr-FR")}
          </p>
          {accouplement.typeParente && (
            <p className="text-sm font-medium text-destructive">
              {accouplement.typeParente}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <StatusBadge
            label={LABEL_NIVEAU_ALERTE[accouplement.niveauAlerte]}
            tone={TONE_NIVEAU_ALERTE[accouplement.niveauAlerte]}
          />
          <StatusBadge
            label={LABEL_STATUT_ACCOUPLEMENT[accouplement.statut]}
            tone={TONE_STATUT_ACCOUPLEMENT[accouplement.statut]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Mâle</p>
          {male ? (
            <Link href={`/lapins/${male.id}`} className="font-medium hover:underline">
              {nomAffiche(male)}
            </Link>
          ) : (
            <p className="font-medium">—</p>
          )}
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Femelle</p>
          {femelle ? (
            <Link href={`/lapins/${femelle.id}`} className="font-medium hover:underline">
              {nomAffiche(femelle)}
            </Link>
          ) : (
            <p className="font-medium">—</p>
          )}
        </div>
      </div>

      {accouplement.motifValidationForcee && (
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Motif de validation forcée</p>
          <p>{accouplement.motifValidationForcee}</p>
        </div>
      )}

      {(accouplement.statut === "VALIDE" ||
        accouplement.statut === "VALIDE_MALGRE_ALERTE") &&
        portees?.length === 0 && (
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Mise bas</p>
            <p className="font-medium">
              {libellePeriodeGestation(accouplement.dateAccouplement)}
            </p>
          </div>
        )}

      {enAttente && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Actions</h2>
          <div className="flex flex-wrap gap-2">
            {accouplement.niveauAlerte === "AUCUNE" ? (
              <Button size="sm" onClick={onValider} disabled={valider.isPending}>
                Valider
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAfficherMotif((v) => !v)}
              >
                Valider malgré l&apos;alerte
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={onAnnuler}
              disabled={annuler.isPending}
            >
              Annuler
            </Button>
          </div>

          {afficherMotif && (
            <form
              onSubmit={handleSubmit(onValiderMalgreAlerte)}
              className="flex flex-wrap items-end gap-2"
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="motif">Motif (obligatoire)</Label>
                <Input id="motif" {...register("motif")} />
                {errors.motif && (
                  <p className="text-sm text-destructive">{errors.motif.message}</p>
                )}
              </div>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                Confirmer
              </Button>
            </form>
          )}

          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
        </div>
      )}
    </div>
  );
}
