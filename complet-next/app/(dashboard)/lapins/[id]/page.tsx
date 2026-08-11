"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { SkeletonDetail } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  useIdentifierLapin,
  useLapin,
  useLapins,
  useModifierLapin,
} from "@/hooks/queries/use-lapins";
import { useCages } from "@/hooks/queries/use-cages";
import { useRaces } from "@/hooks/queries/use-races";
import { useCreerMouvement } from "@/hooks/queries/use-mouvements";
import { usePesees } from "@/hooks/queries/use-pesees";
import { useAccouplements } from "@/hooks/queries/use-accouplements";
import { TONE_STATUT_LAPIN, libelleSexe, libelleStatutLapin } from "@/lib/labels";
import { ApiError } from "@/lib/api/client";
import { LapinDetail, LapinResume } from "@/lib/types/lapin";
import { nomAffiche } from "@/lib/format-lapin";
import { cageEstPleine, libelleCage } from "@/lib/format-cage";
import { PhotoLapin } from "@/components/photo-lapin";
import {
  IdentifierLapinFormInput,
  IdentifierLapinFormValues,
  identifierLapinSchema,
  LapinEditFormInput,
  LapinEditFormValues,
  lapinEditSchema,
} from "@/lib/validation/lapin";

function joursDepuis(date: string): number {
  const diffMs = Date.now() - new Date(date).getTime();
  return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);
}

export default function LapinDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: lapin, isLoading } = useLapin(params.id);
  const { data: cages } = useCages();
  const { data: races } = useRaces();
  const { data: pesees } = usePesees({ lapinId: params.id });
  const { data: accouplements } = useAccouplements({ lapinId: params.id });
  const { data: tousLesLapins } = useLapins();
  const enfants = tousLesLapins?.filter(
    (l) => l.pereId === params.id || l.mereId === params.id,
  );
  const creerMouvement = useCreerMouvement();
  const modifierLapin = useModifierLapin(params.id);

  const [cageChoisie, setCageChoisie] = useState("");
  const [afficherEntreeCage, setAfficherEntreeCage] = useState(false);
  const [afficherEdition, setAfficherEdition] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurEdition, setErreurEdition] = useState<string | null>(null);
  // window.confirm() est bloqué silencieusement par certains navigateurs
  // mobiles/webviews (retourne false sans jamais afficher de boîte de
  // dialogue), donnant l'impression que le bouton ne fait rien — on utilise
  // donc une confirmation intégrée à la page plutôt qu'une boîte native
  const [actionAConfirmer, setActionAConfirmer] = useState<"DECES" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors: erreursEdition, isSubmitting: soumissionEdition },
  } = useForm<LapinEditFormInput, unknown, LapinEditFormValues>({
    resolver: zodResolver(lapinEditSchema),
    values: lapin ? { nom: lapin.nom ?? "", raceId: lapin.raceId ?? "" } : undefined,
  });

  if (isLoading) return <SkeletonDetail />;
  if (!lapin) return <EmptyState title="Lapin introuvable" />;
  if (!lapin.identifie) return <FormulaireIdentification lapin={lapin} />;

  async function onSubmitEdition(values: LapinEditFormValues) {
    setErreurEdition(null);
    try {
      await modifierLapin.mutateAsync(values);
      setAfficherEdition(false);
    } catch (error) {
      setErreurEdition(
        error instanceof ApiError ? error.message : "Une erreur est survenue",
      );
    }
  }

  const estActif = lapin.statut !== "DECEDE" && lapin.statut !== "VENDU";

  async function enregistrerMouvement(
    typeMouvement: "ENTREE_CAGE" | "DECES",
    cageId?: string,
  ) {
    setErreur(null);
    try {
      await creerMouvement.mutateAsync({
        lapinId: lapin!.id,
        typeMouvement,
        cageId,
      });
      setAfficherEntreeCage(false);
      setCageChoisie("");
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PhotoLapin lapinId={lapin.id} photoUrl={lapin.photoUrl} size={56} />
          <div>
            <h1 className="text-xl font-semibold">{nomAffiche(lapin)}</h1>
            <p className="text-muted-foreground">{libelleSexe(lapin.sexe)}</p>
            {lapin.sexe === "FEMELLE" && lapin.dernierSevrage && (
              <p className="text-xs text-muted-foreground">
                Sevrage terminé il y a {joursDepuis(lapin.dernierSevrage)} jour
                {joursDepuis(lapin.dernierSevrage) > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAfficherEdition((v) => !v)}
          >
            {afficherEdition ? "Annuler" : "Modifier"}
          </Button>
          <StatusBadge
            label={lapin.origineExterieure ? "Acheté" : "Né à la ferme"}
            tone="neutral"
          />
          <StatusBadge
            label={libelleStatutLapin(lapin.statut, lapin.sexe)}
            tone={TONE_STATUT_LAPIN[lapin.statut]}
          />
        </div>
      </div>

      {afficherEdition && (
        <form
          onSubmit={handleSubmit(onSubmitEdition)}
          className="flex flex-wrap items-end gap-3 rounded-lg border p-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              placeholder="Pour l'identifier plus facilement"
              {...register("nom")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="raceId">Race</Label>
            <Select id="raceId" {...register("raceId")}>
              <option value="">Choisir</option>
              {races?.map((race) => (
                <option key={race.id} value={race.id}>
                  {race.nom}
                </option>
              ))}
            </Select>
            {erreursEdition.raceId && (
              <p className="text-sm text-destructive">{erreursEdition.raceId.message}</p>
            )}
          </div>
          <Button type="submit" size="sm" disabled={soumissionEdition}>
            {soumissionEdition ? "Enregistrement..." : "Enregistrer"}
          </Button>
          {erreurEdition && (
            <p className="w-full text-sm text-destructive">{erreurEdition}</p>
          )}
        </form>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Naissance</p>
          <p className="font-medium">
            {lapin.dateNaissance
              ? new Date(lapin.dateNaissance).toLocaleDateString("fr-FR")
              : "—"}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Clapier actuel</p>
          {lapin.cageActuelle ? (
            <Link
              href={`/cages/${lapin.cageActuelle.id}`}
              className="font-medium hover:underline"
            >
              {lapin.cageActuelle.numero}
            </Link>
          ) : (
            <p className="font-medium">—</p>
          )}
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Pesées</p>
          <p className="font-medium">{lapin._count.pesees}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Descendance</p>
          <p className="font-medium">
            {lapin._count.enfantsPaternite + lapin._count.enfantsMaternite}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Généalogie</h2>
        {lapin.origineExterieure ? (
          <p className="text-muted-foreground">
            Origine extérieure (achetée), parents inconnus.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <GenealogieLien label="Père" lapin={lapin.pere} />
            <GenealogieLien label="Mère" lapin={lapin.mere} />
          </div>
        )}
      </div>

      {accouplements && accouplements.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-medium">Accouplements</h2>
          <div className="flex flex-col gap-2">
            {accouplements.map((a) => (
              <Link
                key={a.id}
                href={`/accouplements/${a.id}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                <span>
                  {nomAffiche(a.male)} × {nomAffiche(a.femelle)}
                </span>
                <span className="text-muted-foreground">
                  {new Date(a.dateAccouplement).toLocaleDateString("fr-FR")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {enfants && enfants.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-medium">Descendance</h2>
          <div className="flex flex-col gap-2">
            {enfants.map((enfant) => (
              <Link
                key={enfant.id}
                href={`/lapins/${enfant.id}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                <span>{nomAffiche(enfant)}</span>
                <span className="text-muted-foreground">{libelleSexe(enfant.sexe)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {pesees && pesees.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-medium">Pesées</h2>
          <div className="flex flex-col gap-2">
            {pesees.map((pesee) => (
              <div
                key={pesee.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>{new Date(pesee.date).toLocaleDateString("fr-FR")}</span>
                <span className="font-medium">{pesee.poids} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {estActif && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAfficherEntreeCage((v) => !v)}
            >
              {lapin.cageActuelle ? "Changer de clapier" : "Entrer en clapier"}
            </Button>
            <Link href={`/pesees?lapinId=${lapin.id}`}>
              <Button size="sm" variant="outline">
                Ajouter une pesée
              </Button>
            </Link>
            <Link href={`/sante?lapinId=${lapin.id}`}>
              <Button size="sm" variant="outline">
                Ajouter un suivi santé
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setActionAConfirmer("DECES")}
            >
              Marquer décédé
            </Button>
            <Link href={`/ventes?lapinId=${lapin.id}`}>
              <Button size="sm" variant="destructive">
                Vendre
              </Button>
            </Link>
          </div>

          {actionAConfirmer && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/50 p-3 text-sm">
              <p>Confirmer le décès de ce lapin ?</p>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  enregistrerMouvement(actionAConfirmer);
                  setActionAConfirmer(null);
                }}
              >
                Oui, confirmer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActionAConfirmer(null)}
              >
                Annuler
              </Button>
            </div>
          )}

          {afficherEntreeCage && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="cage">
                  Clapier de destination
                </label>
                <Select
                  id="cage"
                  value={cageChoisie}
                  onChange={(e) => setCageChoisie(e.target.value)}
                >
                  <option value="">Choisir un clapier</option>
                  {cages?.map((cage) => (
                    <option
                      key={cage.id}
                      value={cage.id}
                      // la couleur est le seul style qu'un <option> natif
                      // respecte de façon fiable sur tous les navigateurs
                      style={cageEstPleine(cage) ? { color: "red" } : undefined}
                    >
                      {libelleCage(cage)}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                size="sm"
                disabled={!cageChoisie}
                onClick={() => enregistrerMouvement("ENTREE_CAGE", cageChoisie)}
              >
                Valider
              </Button>
            </div>
          )}

          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
        </div>
      )}
    </div>
  );
}

function FormulaireIdentification({ lapin }: { lapin: LapinDetail }) {
  const { data: races } = useRaces();
  const identifierLapin = useIdentifierLapin(lapin.id);
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IdentifierLapinFormInput, unknown, IdentifierLapinFormValues>({
    resolver: zodResolver(identifierLapinSchema),
  });

  async function onSubmit(values: IdentifierLapinFormValues) {
    setErreur(null);
    try {
      const date = new Date();
      date.setDate(date.getDate() - values.ageApproximatifSemaines * 7);
      await identifierLapin.mutateAsync({
        nom: values.nom,
        raceId: values.raceId,
        sexe: values.sexe,
        dateNaissance: date.toISOString(),
      });
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{lapin.codeIdentification}</h1>
          <p className="text-muted-foreground">
            Créé en lot, en attente d&apos;identification
          </p>
        </div>
        <StatusBadge label="Non identifié" tone="warning" />
      </div>

      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">Clapier actuel</p>
        {lapin.cageActuelle ? (
          <Link
            href={`/cages/${lapin.cageActuelle.id}`}
            className="font-medium hover:underline"
          >
            {lapin.cageActuelle.numero}
          </Link>
        ) : (
          <p className="font-medium">—</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <h2 className="text-lg font-medium">
            Identifier ce lapin (oreilles marquées)
          </h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nom">Nom (optionnel)</Label>
            <Input
              id="nom"
              placeholder="Pour l'identifier plus facilement"
              {...register("nom")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="raceId">Race</Label>
            <Select id="raceId" {...register("raceId")}>
              <option value="">Choisir</option>
              {races?.map((race) => (
                <option key={race.id} value={race.id}>
                  {race.nom}
                </option>
              ))}
            </Select>
            {errors.raceId && (
              <p className="text-sm text-destructive">{errors.raceId.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sexe">Sexe</Label>
            <Select id="sexe" {...register("sexe")}>
              <option value="MALE">Mâle</option>
              <option value="FEMELLE">Femelle</option>
            </Select>
          </div>
          <div className="mb-3 flex flex-col gap-1.5">
            <Label htmlFor="ageApproximatifSemaines">Âge approximatif (semaines)</Label>
            <Input
              id="ageApproximatifSemaines"
              type="number"
              min={1}
              {...register("ageApproximatifSemaines")}
            />
            {errors.ageApproximatifSemaines && (
              <p className="text-sm text-destructive">
                {errors.ageApproximatifSemaines.message}
              </p>
            )}
          </div>
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Identifier"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function GenealogieLien({ label, lapin }: { label: string; lapin: LapinResume | null }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {lapin ? (
        <Link href={`/lapins/${lapin.id}`} className="font-medium hover:underline">
          {nomAffiche(lapin)}
        </Link>
      ) : (
        <p className="font-medium">Inconnu</p>
      )}
    </div>
  );
}
