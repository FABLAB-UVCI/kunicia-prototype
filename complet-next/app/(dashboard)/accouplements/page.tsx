"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { SkeletonRows } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useLapins } from "@/hooks/queries/use-lapins";
import {
  useAccouplements,
  useCreerAccouplement,
  useVerifierParente,
} from "@/hooks/queries/use-accouplements";
import { usePortees } from "@/hooks/queries/use-portees";
import { AccouplementFormValues, accouplementSchema } from "@/lib/validation/accouplement";
import { ApiError } from "@/lib/api/client";
import { nomAffiche } from "@/lib/format-lapin";
import { libellePeriodeGestation } from "@/lib/format-gestation";
import {
  LABEL_NIVEAU_ALERTE,
  LABEL_STATUT_ACCOUPLEMENT,
  TONE_NIVEAU_ALERTE,
  TONE_STATUT_ACCOUPLEMENT,
  libelleStatutLapin,
} from "@/lib/labels";

export default function AccouplementsPage() {
  const router = useRouter();
  const { data: accouplements, isLoading } = useAccouplements();
  const { data: lapins } = useLapins();
  const { data: portees } = usePortees();
  const accouplementsAvecPorteeIds = new Set(portees?.map((p) => p.accouplementId));
  const creerAccouplement = useCreerAccouplement();
  const [erreur, setErreur] = useState<string | null>(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState<"EN_ATTENTE" | "TOUS">("EN_ATTENTE");

  const accouplementsAffiches = accouplements?.filter(
    (a) => filtreStatut === "TOUS" || a.statut === "EN_ATTENTE",
  );

  // un lapin déjà engagé dans un accouplement en attente (pas encore validé
  // ni annulé) ne doit pas pouvoir être proposé pour un second accouplement
  // en parallèle — une fois celui-ci validé ou annulé, il redevient
  // disponible
  const lapinsEnAttenteIds = new Set(
    accouplements
      ?.filter((a) => a.statut === "EN_ATTENTE")
      .flatMap((a) => [a.maleId, a.femelleId]),
  );

  const males = lapins?.filter(
    (l) =>
      l.sexe === "MALE" &&
      l.statut !== "DECEDE" &&
      l.statut !== "VENDU" &&
      !lapinsEnAttenteIds.has(l.id),
  );
  const femelles = lapins?.filter(
    (l) =>
      l.sexe === "FEMELLE" &&
      l.statut !== "DECEDE" &&
      l.statut !== "VENDU" &&
      // en gestation ou en allaitement : indisponible pour un nouvel
      // accouplement tant que le sevrage de la portée en cours n'est pas
      // confirmé
      l.statut !== "EN_GESTATION" &&
      l.statut !== "ALLAITEMENT" &&
      !lapinsEnAttenteIds.has(l.id),
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccouplementFormValues>({ resolver: zodResolver(accouplementSchema) });

  // vérification en direct dès que les deux lapins sont choisis, sans
  // attendre la création de l'accouplement pour découvrir l'alerte
  const maleIdChoisi = watch("maleId");
  const femelleIdChoisie = watch("femelleId");
  const { data: verification } = useVerifierParente(
    maleIdChoisi ?? "",
    femelleIdChoisie ?? "",
  );

  async function onSubmit(values: AccouplementFormValues) {
    setErreur(null);
    try {
      const accouplement = await creerAccouplement.mutateAsync(values);
      reset();
      setAfficherFormulaire(false);
      router.push(`/accouplements/${accouplement.id}`);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Accouplements</h1>
        <Button size="sm" onClick={() => setAfficherFormulaire((v) => !v)}>
          {afficherFormulaire ? "Annuler" : "Nouvel accouplement"}
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="filtreStatut">Afficher</Label>
        <Select
          id="filtreStatut"
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value as "EN_ATTENTE" | "TOUS")}
        >
          <option value="EN_ATTENTE">En attente de validation</option>
          <option value="TOUS">Tous les accouplements</option>
        </Select>
      </div>

      {afficherFormulaire && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvel accouplement</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maleId">Mâle</Label>
                <Select
                  id="maleId"
                  {...register("maleId")}
                >
                  <option value="">Choisir</option>
                  {males?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {nomAffiche(l)} — {libelleStatutLapin(l.statut, l.sexe)}
                    </option>
                  ))}
                </Select>
                {errors.maleId && (
                  <p className="text-sm text-destructive">{errors.maleId.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="femelleId">Femelle</Label>
                <Select
                  id="femelleId"
                  {...register("femelleId")}
                >
                  <option value="">Choisir</option>
                  {femelles?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {nomAffiche(l)} — {libelleStatutLapin(l.statut, l.sexe)}
                    </option>
                  ))}
                </Select>
                {errors.femelleId && (
                  <p className="text-sm text-destructive">{errors.femelleId.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateAccouplement">Date</Label>
                <Input id="dateAccouplement" type="date" {...register("dateAccouplement")} />
                {errors.dateAccouplement && (
                  <p className="text-sm text-destructive">
                    {errors.dateAccouplement.message}
                  </p>
                )}
              </div>
              {verification && verification.niveauAlerte !== "AUCUNE" && (
                <div className="mb-3 rounded-lg border border-destructive/50 p-3 text-sm sm:col-span-3">
                  <p className="font-medium text-destructive">
                    {LABEL_NIVEAU_ALERTE[verification.niveauAlerte]}
                    {verification.typeParente ? ` — ${verification.typeParente}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    Risque de consanguinité détecté entre ces deux lapins — une
                    validation forcée avec motif sera nécessaire.
                  </p>
                </div>
              )}
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

      {!isLoading && accouplementsAffiches && accouplementsAffiches.length > 0 && (
        <div className="flex flex-col gap-2">
          {accouplementsAffiches.map((a) => (
            <Link
              key={a.id}
              href={`/accouplements/${a.id}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              <div>
                <p className="font-medium">
                  {nomAffiche(a.male)} × {nomAffiche(a.femelle)}
                </p>
                <p className="text-muted-foreground">
                  {new Date(a.dateAccouplement).toLocaleDateString("fr-FR")}
                </p>
                {a.typeParente && (
                  <p className="text-xs text-destructive">{a.typeParente}</p>
                )}
                {(a.statut === "VALIDE" || a.statut === "VALIDE_MALGRE_ALERTE") &&
                  !accouplementsAvecPorteeIds.has(a.id) && (
                    <p className="text-xs text-muted-foreground">
                      {libellePeriodeGestation(a.dateAccouplement)}
                    </p>
                  )}
              </div>
              <div className="flex gap-2">
                <StatusBadge
                  label={LABEL_NIVEAU_ALERTE[a.niveauAlerte]}
                  tone={TONE_NIVEAU_ALERTE[a.niveauAlerte]}
                />
                <StatusBadge
                  label={LABEL_STATUT_ACCOUPLEMENT[a.statut]}
                  tone={TONE_STATUT_ACCOUPLEMENT[a.statut]}
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && accouplementsAffiches?.length === 0 && (
        <EmptyState
          title={
            filtreStatut === "EN_ATTENTE"
              ? "Aucun accouplement en attente de validation"
              : "Aucun accouplement enregistré"
          }
          description={
            filtreStatut === "EN_ATTENTE"
              ? "Passe sur « Tous les accouplements » pour voir l'historique complet."
              : "Propose un premier accouplement avec le bouton ci-dessus."
          }
        />
      )}
    </div>
  );
}
