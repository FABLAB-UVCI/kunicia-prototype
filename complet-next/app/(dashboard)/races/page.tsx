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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkeletonCardGrid } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  useCreerRace,
  useModifierRace,
  useRaces,
  useSupprimerRace,
} from "@/hooks/queries/use-races";
import { RaceFormInput, RaceFormValues, raceSchema } from "@/lib/validation/race";
import { ApiError } from "@/lib/api/client";
import { Race } from "@/lib/types/race";

function FormulaireRace({
  valeursInitiales,
  onSubmit,
  isSubmitting,
  onAnnuler,
}: {
  valeursInitiales?: Race;
  onSubmit: (values: RaceFormValues) => Promise<void>;
  isSubmitting: boolean;
  onAnnuler?: () => void;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RaceFormInput, unknown, RaceFormValues>({
    resolver: zodResolver(raceSchema),
    defaultValues: valeursInitiales
      ? {
          nom: valeursInitiales.nom,
          poidsAdulteMoyen: valeursInitiales.poidsAdulteMoyen ?? undefined,
          paysOrigine: valeursInitiales.paysOrigine ?? undefined,
          aptitude: valeursInitiales.aptitude ?? undefined,
          caracteristiques: valeursInitiales.caracteristiques.join(", "),
        }
      : undefined,
  });

  async function soumettre(values: RaceFormValues) {
    setErreur(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <form onSubmit={handleSubmit(soumettre)}>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nom">Nom</Label>
          <Input id="nom" autoComplete="off" {...register("nom")} />
          {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="poidsAdulteMoyen">Poids adulte moyen (kg, optionnel)</Label>
          <Input
            id="poidsAdulteMoyen"
            type="number"
            step="0.1"
            min={0}
            {...register("poidsAdulteMoyen")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="paysOrigine">Origine / pays (optionnel)</Label>
          <Input id="paysOrigine" {...register("paysOrigine")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="aptitude">Aptitude (optionnel)</Label>
          <Input id="aptitude" placeholder="Chair, Laine, Ornementale..." {...register("aptitude")} />
        </div>
        <div className="mb-3 flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="caracteristiques">Caractéristiques (optionnel)</Label>
          <Input
            id="caracteristiques"
            placeholder="Robe fauve, Croissance lente, Grande taille..."
            {...register("caracteristiques")}
          />
          <p className="text-xs text-muted-foreground">Séparées par des virgules.</p>
        </div>
        {erreur && <p className="text-sm text-destructive sm:col-span-2">{erreur}</p>}
      </CardContent>
      <CardFooter className="gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
        {onAnnuler && (
          <Button type="button" variant="outline" onClick={onAnnuler} disabled={isSubmitting}>
            Annuler
          </Button>
        )}
      </CardFooter>
    </form>
  );
}

function CarteRace({ race }: { race: Race }) {
  const [enEdition, setEnEdition] = useState(false);
  const modifierRace = useModifierRace(race.id);
  const supprimerRace = useSupprimerRace();
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  if (enEdition) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Modifier {race.nom}</CardTitle>
        </CardHeader>
        <FormulaireRace
          valeursInitiales={race}
          isSubmitting={modifierRace.isPending}
          onAnnuler={() => setEnEdition(false)}
          onSubmit={async (values) => {
            await modifierRace.mutateAsync(values);
            setEnEdition(false);
          }}
        />
      </Card>
    );
  }

  async function supprimer() {
    setErreurSuppression(null);
    try {
      await supprimerRace.mutateAsync(race.id);
    } catch (error) {
      setErreurSuppression(
        error instanceof ApiError ? error.message : "Une erreur est survenue",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{race.nom}</CardTitle>
        {race.aptitude && <CardDescription>{race.aptitude}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="text-muted-foreground">
            Poids adulte moyen{" "}
            <span className="text-foreground">
              {race.poidsAdulteMoyen ? `${race.poidsAdulteMoyen} kg` : "—"}
            </span>
          </p>
          <p className="text-muted-foreground">
            Origine <span className="text-foreground">{race.paysOrigine ?? "—"}</span>
          </p>
        </div>
        {race.caracteristiques.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {race.caracteristiques.map((c) => (
              <span
                key={c}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {race._count.lapins} lapin{race._count.lapins > 1 ? "s" : ""}
        </p>
        {erreurSuppression && (
          <p className="text-sm text-destructive">{erreurSuppression}</p>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" variant="outline" onClick={() => setEnEdition(true)}>
          Modifier
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={supprimer}
          disabled={supprimerRace.isPending || race._count.lapins > 0}
        >
          Supprimer
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function RacesPage() {
  const { data: races, isLoading } = useRaces();
  const creerRace = useCreerRace();
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Races</h1>
        <Button size="sm" onClick={() => setAfficherFormulaire((v) => !v)}>
          {afficherFormulaire ? "Annuler" : "Nouvelle race"}
        </Button>
      </div>

      {afficherFormulaire && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle race</CardTitle>
          </CardHeader>
          <FormulaireRace
            isSubmitting={creerRace.isPending}
            onSubmit={async (values) => {
              await creerRace.mutateAsync(values);
              setAfficherFormulaire(false);
            }}
          />
        </Card>
      )}

      {isLoading && <SkeletonCardGrid />}

      {!isLoading && races && races.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <CarteRace key={race.id} race={race} />
          ))}
        </div>
      )}

      {!isLoading && races?.length === 0 && (
        <EmptyState
          title="Aucune race enregistrée"
          description="Crée ta première race avec le bouton ci-dessus."
        />
      )}
    </div>
  );
}
