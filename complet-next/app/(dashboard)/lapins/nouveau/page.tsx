"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
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
import { useCreerLapin, useCreerLapinsLot } from "@/hooks/queries/use-lapins";
import { useRaces } from "@/hooks/queries/use-races";
import { useCages } from "@/hooks/queries/use-cages";
import {
  LapinFormInput,
  LapinFormValues,
  lapinSchema,
  LapinsLotFormInput,
  LapinsLotFormValues,
  lapinsLotSchema,
} from "@/lib/validation/lapin";
import { ApiError } from "@/lib/api/client";
import { uploaderPhotoLapin } from "@/lib/api/lapins";
import { libelleCage } from "@/lib/format-cage";

function calculerDateNaissance(ageApproximatifSemaines: number): string {
  const date = new Date();
  date.setDate(date.getDate() - ageApproximatifSemaines * 7);
  return date.toISOString();
}

function FormulaireUnique() {
  const router = useRouter();
  const creerLapin = useCreerLapin();
  const { data: races } = useRaces();
  const [erreur, setErreur] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const inputPhotoRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LapinFormInput, unknown, LapinFormValues>({
    resolver: zodResolver(lapinSchema),
  });

  async function onSubmit(values: LapinFormValues) {
    setErreur(null);
    try {
      const lapin = await creerLapin.mutateAsync({
        nom: values.nom,
        raceId: values.raceId,
        sexe: values.sexe,
        dateNaissance: calculerDateNaissance(values.ageApproximatifSemaines),
      });
      // la photo est optionnelle : un échec de l'upload ne doit pas bloquer
      // la création du lapin, qui a déjà réussi à ce stade
      if (photo) {
        await uploaderPhotoLapin(lapin.id, photo).catch(() => {});
      }
      router.push(`/lapins/${lapin.id}`);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Photo (optionnel)</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputPhotoRef.current?.click()}
            >
              <Camera />
              {photo ? "Changer la photo" : "Prendre ou choisir une photo"}
            </Button>
            {photo && (
              <span className="text-xs text-muted-foreground">{photo.name}</span>
            )}
          </div>
          <input
            ref={inputPhotoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nom">Nom (optionnel)</Label>
          <Input id="nom" placeholder="Pour l'identifier plus facilement" {...register("nom")} />
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
          <p className="text-xs text-muted-foreground">
            La date de naissance sera estimée à partir de cet âge — utile car un
            lapin acheté n&apos;a presque jamais de date de naissance exacte connue.
          </p>
        </div>
        {erreur && <p className="text-sm text-destructive">{erreur}</p>}
      </CardContent>
      <CardFooter className="gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Création..." : "Créer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/lapins")}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
      </CardFooter>
    </form>
  );
}

function FormulaireLot() {
  const router = useRouter();
  const creerLapinsLot = useCreerLapinsLot();
  const { data: cages } = useCages();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LapinsLotFormInput, unknown, LapinsLotFormValues>({
    resolver: zodResolver(lapinsLotSchema),
  });

  async function onSubmit(values: LapinsLotFormValues) {
    setErreur(null);
    try {
      await creerLapinsLot.mutateAsync(values);
      router.push("/lapins");
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre">Combien de lapins ?</Label>
          <Input id="nombre" type="number" min={1} {...register("nombre")} />
          {errors.nombre && (
            <p className="text-sm text-destructive">{errors.nombre.message}</p>
          )}
        </div>
        <div className="mb-3 flex flex-col gap-1.5">
          <Label htmlFor="cageId">Clapier (optionnel)</Label>
          <Select id="cageId" {...register("cageId")}>
            <option value="">Ne pas assigner de clapier</option>
            {cages?.map((cage) => (
              <option key={cage.id} value={cage.id}>
                {libelleCage(cage)}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Chaque lapin reçoit tout de suite un identifiant (à noter sur son
            oreille), sans race/sexe/date de naissance — tu reviendras
            compléter chaque fiche une fois les lapins identifiés
            physiquement.
          </p>
        </div>
        {erreur && <p className="text-sm text-destructive">{erreur}</p>}
      </CardContent>
      <CardFooter className="gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Création..." : "Créer les identifiants"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/lapins")}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
      </CardFooter>
    </form>
  );
}

export default function NouveauLapinPage() {
  const [mode, setMode] = useState<"UNIQUE" | "LOT">("UNIQUE");

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Nouveau lapin</CardTitle>
        <CardDescription>
          Uniquement pour un lapin d&apos;origine extérieure (acheté). Les lapins
          nés dans la ferme sont créés via le sevrage d&apos;une reproduction.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2 pb-0">
        <Button
          type="button"
          size="sm"
          variant={mode === "UNIQUE" ? "default" : "outline"}
          onClick={() => setMode("UNIQUE")}
        >
          Un seul lapin
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "LOT" ? "default" : "outline"}
          onClick={() => setMode("LOT")}
        >
          Plusieurs lapins (à identifier plus tard)
        </Button>
      </CardContent>
      {mode === "UNIQUE" ? <FormulaireUnique /> : <FormulaireLot />}
    </Card>
  );
}
