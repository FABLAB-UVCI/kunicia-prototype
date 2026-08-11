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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkeletonCardGrid } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useVentes } from "@/hooks/queries/use-ventes";
import {
  useCreerDepense,
  useDepenses,
  useSupprimerDepense,
} from "@/hooks/queries/use-depenses";
import { DepenseFormInput, DepenseFormValues, depenseSchema } from "@/lib/validation/depense";
import { ApiError } from "@/lib/api/client";
import { nomAffiche } from "@/lib/format-lapin";

const CATEGORIES_SUGGESTIONS = [
  "Alimentation",
  "Vétérinaire",
  "Équipement",
  "Transport",
  "Autre",
];

type Periode = "mois" | "annee" | "tout";

function dansPeriode(date: string, periode: Periode): boolean {
  if (periode === "tout") return true;
  const d = new Date(date);
  const maintenant = new Date();
  if (periode === "annee") return d.getFullYear() === maintenant.getFullYear();
  return (
    d.getFullYear() === maintenant.getFullYear() &&
    d.getMonth() === maintenant.getMonth()
  );
}

export default function FinancePage() {
  const { data: ventes, isLoading: ventesEnChargement } = useVentes();
  const { data: depenses, isLoading: depensesEnChargement } = useDepenses();
  const creerDepense = useCreerDepense();
  const supprimerDepense = useSupprimerDepense();
  const [periode, setPeriode] = useState<Periode>("mois");
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepenseFormInput, unknown, DepenseFormValues>({
    resolver: zodResolver(depenseSchema),
  });

  async function onSubmit(values: DepenseFormValues) {
    setErreur(null);
    try {
      await creerDepense.mutateAsync(values);
      reset();
      setAfficherFormulaire(false);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  const enChargement = ventesEnChargement || depensesEnChargement;

  if (enChargement) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold">Finance</h1>
        <SkeletonCardGrid count={3} />
      </div>
    );
  }

  const ventesPeriode = (ventes ?? []).filter((v) => dansPeriode(v.dateVente, periode));
  const depensesPeriode = (depenses ?? []).filter((d) => dansPeriode(d.date, periode));

  const chiffreAffaires = ventesPeriode.reduce((total, v) => total + v.prix, 0);
  const totalDepenses = depensesPeriode.reduce((total, d) => total + d.montant, 0);
  const solde = chiffreAffaires - totalDepenses;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Finance</h1>
        <div className="flex items-center gap-2">
          <Select
            value={periode}
            onChange={(e) => setPeriode(e.target.value as Periode)}
            className="w-auto"
          >
            <option value="mois">Ce mois-ci</option>
            <option value="annee">Cette année</option>
            <option value="tout">Depuis le début</option>
          </Select>
          <Button size="sm" onClick={() => setAfficherFormulaire((v) => !v)}>
            {afficherFormulaire ? "Annuler" : "Nouvelle dépense"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Chiffre d&apos;affaires</p>
            <p className="text-2xl font-semibold text-chart-1">
              {chiffreAffaires.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              {ventesPeriode.length} vente{ventesPeriode.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Dépenses</p>
            <p className="text-2xl font-semibold text-destructive">
              {totalDepenses.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              {depensesPeriode.length} dépense{depensesPeriode.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Solde net</p>
            <p
              className={`text-2xl font-semibold ${solde >= 0 ? "text-chart-1" : "text-destructive"}`}
            >
              {solde.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Sur la période sélectionnée</p>
          </CardContent>
        </Card>
      </div>

      {afficherFormulaire && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle dépense</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="categorie">Catégorie</Label>
                <Input
                  id="categorie"
                  list="categories-depense"
                  autoComplete="off"
                  {...register("categorie")}
                />
                <datalist id="categories-depense">
                  {CATEGORIES_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {errors.categorie && (
                  <p className="text-sm text-destructive">{errors.categorie.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="libelle">Libellé</Label>
                <Input id="libelle" {...register("libelle")} />
                {errors.libelle && (
                  <p className="text-sm text-destructive">{errors.libelle.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="montant">Montant</Label>
                <Input id="montant" type="number" step="0.01" min={0} {...register("montant")} />
                {errors.montant && (
                  <p className="text-sm text-destructive">{errors.montant.message}</p>
                )}
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <Label htmlFor="date">Date (optionnel, défaut = maintenant)</Label>
                <Input id="date" type="date" {...register("date")} />
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
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Ventes</h2>
            <Link href="/ventes" className="text-sm text-muted-foreground hover:underline">
              Voir tout
            </Link>
          </div>
          {ventesPeriode.length === 0 ? (
            <EmptyState title="Aucune vente sur la période" />
          ) : (
            ventesPeriode.map((vente) => (
              <div
                key={vente.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>{nomAffiche(vente.lapin)}</span>
                <span className="font-medium">{vente.prix.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Dépenses</h2>
          {depensesPeriode.length === 0 ? (
            <EmptyState title="Aucune dépense sur la période" />
          ) : (
            depensesPeriode.map((depense) => (
              <div
                key={depense.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div>
                  <p>{depense.libelle}</p>
                  <p className="text-xs text-muted-foreground">{depense.categorie}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{depense.montant.toFixed(2)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => supprimerDepense.mutate(depense.id)}
                    disabled={supprimerDepense.isPending}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
