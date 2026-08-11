"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { SkeletonDetail } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useConfirmerSevrage, usePortee } from "@/hooks/queries/use-portees";
import { useRaces } from "@/hooks/queries/use-races";
import {
  SevrageFormInput,
  SevrageFormValues,
  sevrageSchema,
} from "@/lib/validation/portee";
import { ApiError } from "@/lib/api/client";
import { LABEL_SEXE, TONE_STATUT_LAPIN, libelleStatutLapin } from "@/lib/labels";
import { nomAffiche } from "@/lib/format-lapin";

export default function PorteeDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: portee, isLoading } = usePortee(params.id);
  const { data: races } = useRaces();
  const confirmerSevrage = useConfirmerSevrage(params.id);
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SevrageFormInput, unknown, SevrageFormValues>({
    resolver: zodResolver(sevrageSchema),
    defaultValues: { dateSevrage: "", lapins: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lapins" });

  if (isLoading) return <SkeletonDetail />;
  if (!portee) return <EmptyState title="Reproduction introuvable" />;

  async function onSubmit(values: SevrageFormValues) {
    setErreur(null);
    try {
      await confirmerSevrage.mutateAsync(values);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">
          Reproduction du {new Date(portee.dateNaissance).toLocaleDateString("fr-FR")}
        </h1>
        <p className="text-muted-foreground">
          {nomAffiche(portee.accouplement.male)} ×{" "}
          {nomAffiche(portee.accouplement.femelle)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Nés</p>
          <p className="font-medium">{portee.nombreNes}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Sevrés</p>
          <p className="font-medium">{portee.lapins.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Poids moyen naissance</p>
          <p className="font-medium">
            {portee.poidsMoyenNaissance ? `${portee.poidsMoyenNaissance} kg` : "—"}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Sevrage</p>
          <p className="font-medium">
            {portee.dateSevrage
              ? new Date(portee.dateSevrage).toLocaleDateString("fr-FR")
              : "Non confirmé"}
          </p>
        </div>
      </div>

      {!portee.dateSevrage && (
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">
            Localisation actuelle (avec la mère)
          </p>
          {portee.accouplement.femelle.cageActuelle ? (
            <Link
              href={`/cages/${portee.accouplement.femelle.cageActuelle.id}`}
              className="font-medium hover:underline"
            >
              {portee.accouplement.femelle.cageActuelle.numero}
            </Link>
          ) : (
            <p className="font-medium">
              {nomAffiche(portee.accouplement.femelle)} n&apos;est dans aucun
              clapier actuellement
            </p>
          )}
        </div>
      )}

      {portee.dateSevrage ? (
        <div>
          <h2 className="mb-2 text-lg font-medium">Lapins issus de cette reproduction</h2>
          {portee.lapins.length === 0 ? (
            <p className="text-muted-foreground">Aucun survivant (perte totale).</p>
          ) : (
            <div className="flex flex-col gap-2">
              {portee.lapins.map((lapin) => (
                <Link
                  key={lapin.id}
                  href={`/lapins/${lapin.id}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                >
                  <span>
                    {nomAffiche(lapin)} ({LABEL_SEXE[lapin.sexe]})
                  </span>
                  <StatusBadge
                    label={libelleStatutLapin(lapin.statut, lapin.sexe)}
                    tone={TONE_STATUT_LAPIN[lapin.statut]}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Confirmer le sevrage</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 sm:max-w-xs">
              <Label htmlFor="dateSevrage">Date de sevrage</Label>
              <Input id="dateSevrage" type="date" {...register("dateSevrage")} />
              {errors.dateSevrage && (
                <p className="text-sm text-destructive">{errors.dateSevrage.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap items-end gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`lapins.${index}.nom`}>Nom (optionnel)</Label>
                    <Input id={`lapins.${index}.nom`} {...register(`lapins.${index}.nom`)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`lapins.${index}.raceId`}>Race</Label>
                    <Select
                      id={`lapins.${index}.raceId`}
                      {...register(`lapins.${index}.raceId`)}
                    >
                      <option value="">Choisir</option>
                      {races?.map((race) => (
                        <option key={race.id} value={race.id}>
                          {race.nom}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`lapins.${index}.sexe`}>Sexe</Label>
                    <Select
                      id={`lapins.${index}.sexe`}
                      {...register(`lapins.${index}.sexe`)}
                    >
                      <option value="MALE">Mâle</option>
                      <option value="FEMELLE">Femelle</option>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    Retirer
                  </Button>
                </div>
              ))}

              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={fields.length >= portee.nombreNes}
                  onClick={() => append({ nom: "", raceId: "", sexe: "MALE" })}
                >
                  Ajouter un survivant ({fields.length}/{portee.nombreNes})
                </Button>
              </div>
            </div>

            {erreur && <p className="text-sm text-destructive">{erreur}</p>}

            <div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Confirmation..." : "Confirmer le sevrage"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
