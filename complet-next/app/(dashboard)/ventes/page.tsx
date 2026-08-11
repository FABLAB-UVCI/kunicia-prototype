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
import { useClients } from "@/hooks/queries/use-clients";
import { useCreerVente, useVentes } from "@/hooks/queries/use-ventes";
import { VenteFormInput, VenteFormValues, venteSchema } from "@/lib/validation/vente";
import { ApiError } from "@/lib/api/client";
import { nomAffiche } from "@/lib/format-lapin";

function VentesContent() {
  const searchParams = useSearchParams();
  const lapinIdPrefilled = searchParams.get("lapinId") ?? "";

  const { data: lapins } = useLapins();
  const { data: clients } = useClients();
  const { data: ventes, isLoading } = useVentes();
  const creerVente = useCreerVente();
  const [erreur, setErreur] = useState<string | null>(null);

  const lapinsVendables = lapins?.filter(
    (l) => l.statut !== "DECEDE" && l.statut !== "VENDU" && l.identifie,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VenteFormInput, unknown, VenteFormValues>({
    resolver: zodResolver(venteSchema),
    defaultValues: { lapinId: lapinIdPrefilled },
  });

  async function onSubmit(values: VenteFormValues) {
    setErreur(null);
    try {
      await creerVente.mutateAsync(values);
      reset({ lapinId: "", clientId: "", prix: undefined, dateVente: undefined });
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Ventes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle vente</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lapinId">Lapin</Label>
              <Select id="lapinId" {...register("lapinId")}>
                <option value="">Choisir</option>
                {lapinsVendables?.map((l) => (
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
              <Label htmlFor="clientId">Client (optionnel)</Label>
              <Select id="clientId" {...register("clientId")}>
                <option value="">Non renseigné</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prix">Prix</Label>
              <Input id="prix" type="number" step="0.01" min={0} {...register("prix")} />
              {errors.prix && (
                <p className="text-sm text-destructive">{errors.prix.message}</p>
              )}
            </div>
            <div className="mb-3 flex flex-col gap-1.5">
              <Label htmlFor="dateVente">Date (optionnel, défaut = maintenant)</Label>
              <Input id="dateVente" type="date" {...register("dateVente")} />
            </div>
            {erreur && (
              <p className="text-sm text-destructive sm:col-span-2">{erreur}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer la vente"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isLoading && <SkeletonRows />}

      {!isLoading && ventes && ventes.length > 0 && (
        <div className="flex flex-col gap-2">
          {ventes.map((vente) => (
            <div
              key={vente.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{nomAffiche(vente.lapin)}</p>
                <p className="text-muted-foreground">
                  {vente.client ? vente.client.nom : "Client non renseigné"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{vente.prix.toFixed(2)}</p>
                <p className="text-muted-foreground">
                  {new Date(vente.dateVente).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && ventes?.length === 0 && (
        <EmptyState
          title="Aucune vente enregistrée"
          description="Enregistre une première vente avec le formulaire ci-dessus."
        />
      )}
    </div>
  );
}

export default function VentesPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Chargement...</p>}>
      <VentesContent />
    </Suspense>
  );
}
