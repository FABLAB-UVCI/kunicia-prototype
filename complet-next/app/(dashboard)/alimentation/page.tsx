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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkeletonCardGrid } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useCages } from "@/hooks/queries/use-cages";
import { useCreerDistribution, useCreerStock, useStocks } from "@/hooks/queries/use-alimentation";
import {
  DistributionFormInput,
  DistributionFormValues,
  StockFormInput,
  StockFormValues,
  distributionSchema,
  stockSchema,
} from "@/lib/validation/alimentation";
import { ApiError } from "@/lib/api/client";
import { cageEstPleine, libelleCage } from "@/lib/format-cage";

export default function AlimentationPage() {
  const { data: stocks, isLoading } = useStocks();
  const { data: cages } = useCages();
  const creerStock = useCreerStock();
  const creerDistribution = useCreerDistribution();

  const [erreurStock, setErreurStock] = useState<string | null>(null);
  const [erreurDistribution, setErreurDistribution] = useState<string | null>(null);
  const [afficherFormulaireStock, setAfficherFormulaireStock] = useState(false);
  const [afficherFormulaireDistribution, setAfficherFormulaireDistribution] =
    useState(false);

  const formStock = useForm<StockFormInput, unknown, StockFormValues>({
    resolver: zodResolver(stockSchema),
  });

  const formDistribution = useForm<DistributionFormInput, unknown, DistributionFormValues>({
    resolver: zodResolver(distributionSchema),
  });

  async function onSubmitStock(values: StockFormValues) {
    setErreurStock(null);
    try {
      await creerStock.mutateAsync(values);
      formStock.reset();
      setAfficherFormulaireStock(false);
    } catch (error) {
      setErreurStock(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  async function onSubmitDistribution(values: DistributionFormValues) {
    setErreurDistribution(null);
    try {
      await creerDistribution.mutateAsync(values);
      formDistribution.reset();
      setAfficherFormulaireDistribution(false);
    } catch (error) {
      setErreurDistribution(
        error instanceof ApiError ? error.message : "Une erreur est survenue",
      );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Alimentation</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAfficherFormulaireDistribution((v) => !v)}
          >
            Nouvelle distribution
          </Button>
          <Button size="sm" onClick={() => setAfficherFormulaireStock((v) => !v)}>
            Nouveau stock
          </Button>
        </div>
      </div>

      {afficherFormulaireStock && (
        <Card>
          <CardHeader>
            <CardTitle>Nouveau stock</CardTitle>
          </CardHeader>
          <form onSubmit={formStock.handleSubmit(onSubmitStock)}>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="typeAliment">Type d&apos;aliment</Label>
                <Input id="typeAliment" {...formStock.register("typeAliment")} />
                {formStock.formState.errors.typeAliment && (
                  <p className="text-sm text-destructive">
                    {formStock.formState.errors.typeAliment.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quantiteInitiale">Quantité initiale (kg)</Label>
                <Input
                  id="quantiteInitiale"
                  type="number"
                  step="0.1"
                  {...formStock.register("quantiteInitiale")}
                />
                {formStock.formState.errors.quantiteInitiale && (
                  <p className="text-sm text-destructive">
                    {formStock.formState.errors.quantiteInitiale.message}
                  </p>
                )}
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <Label htmlFor="dateAchat">Date d&apos;achat (optionnel)</Label>
                <Input id="dateAchat" type="date" {...formStock.register("dateAchat")} />
              </div>
              {erreurStock && (
                <p className="text-sm text-destructive sm:col-span-3">{erreurStock}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={formStock.formState.isSubmitting}>
                {formStock.formState.isSubmitting ? "Création..." : "Créer"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {afficherFormulaireDistribution && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle distribution</CardTitle>
          </CardHeader>
          <form onSubmit={formDistribution.handleSubmit(onSubmitDistribution)}>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stockId">Stock</Label>
                <Select
                  id="stockId"
                  {...formDistribution.register("stockId")}
                >
                  <option value="">Choisir</option>
                  {stocks?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.typeAliment}
                    </option>
                  ))}
                </Select>
                {formDistribution.formState.errors.stockId && (
                  <p className="text-sm text-destructive">
                    {formDistribution.formState.errors.stockId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cageId">Clapier (optionnel)</Label>
                <Select
                  id="cageId"
                  {...formDistribution.register("cageId")}
                >
                  <option value="">Toute la ferme / lot</option>
                  {cages?.map((cage) => (
                    <option
                      key={cage.id}
                      value={cage.id}
                      style={cageEstPleine(cage) ? { color: "red" } : undefined}
                    >
                      {libelleCage(cage)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quantiteParJour">Quantité/jour/lapin (kg)</Label>
                <Input
                  id="quantiteParJour"
                  type="number"
                  step="0.01"
                  {...formDistribution.register("quantiteParJour")}
                />
                {formDistribution.formState.errors.quantiteParJour && (
                  <p className="text-sm text-destructive">
                    {formDistribution.formState.errors.quantiteParJour.message}
                  </p>
                )}
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <Label htmlFor="nombreLapins">Nombre de lapins</Label>
                <Input
                  id="nombreLapins"
                  type="number"
                  min={1}
                  {...formDistribution.register("nombreLapins")}
                />
                {formDistribution.formState.errors.nombreLapins && (
                  <p className="text-sm text-destructive">
                    {formDistribution.formState.errors.nombreLapins.message}
                  </p>
                )}
              </div>
              {erreurDistribution && (
                <p className="text-sm text-destructive sm:col-span-2 lg:col-span-4">
                  {erreurDistribution}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={formDistribution.formState.isSubmitting}>
                {formDistribution.formState.isSubmitting ? "Création..." : "Créer"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {isLoading && <SkeletonCardGrid />}

      {!isLoading && stocks && stocks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stocks.map((stock) => (
            <Link key={stock.id} href={`/alimentation/${stock.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{stock.typeAliment}</CardTitle>
                  <CardDescription>
                    {stock.quantiteRestante.toFixed(1)} /{" "}
                    {stock.quantiteInitiale.toFixed(1)} kg restants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stock.distributionActuelle ? (
                    <p className="text-sm text-muted-foreground">
                      Épuisement estimé le{" "}
                      {new Date(
                        stock.distributionActuelle.dateEpuisementEstimee,
                      ).toLocaleDateString("fr-FR")}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucune distribution en cours
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && stocks?.length === 0 && (
        <EmptyState
          title="Aucun stock enregistré"
          description="Ajoute un premier stock d'aliment avec le bouton ci-dessus."
        />
      )}
    </div>
  );
}
