"use client";

import { useParams } from "next/navigation";
import { SkeletonDetail } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useStock } from "@/hooks/queries/use-alimentation";

export default function StockDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: stock, isLoading } = useStock(params.id);

  if (isLoading) return <SkeletonDetail />;
  if (!stock) return <EmptyState title="Stock introuvable" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{stock.typeAliment}</h1>
        <p className="text-muted-foreground">
          Acheté le {new Date(stock.dateAchat).toLocaleDateString("fr-FR")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Quantité initiale</p>
          <p className="font-medium">{stock.quantiteInitiale.toFixed(1)} kg</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Restant (dernière maj)</p>
          <p className="font-medium">{stock.quantiteRestante.toFixed(1)} kg</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Restant estimé maintenant</p>
          <p className="font-medium">{stock.quantiteRestanteEstimee.toFixed(1)} kg</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Historique des distributions</h2>
        {stock.distributions.length === 0 ? (
          <EmptyState title="Aucune distribution enregistrée" />
        ) : (
          <div className="flex flex-col gap-2">
            {stock.distributions.map((d) => (
              <div key={d.id} className="rounded-lg border px-3 py-2 text-sm">
                <p>
                  {d.quantiteParJour} kg/jour × {d.nombreLapins} lapins ={" "}
                  {d.consommationJournaliere.toFixed(2)} kg/jour
                </p>
                <p className="text-muted-foreground">
                  Début le {new Date(d.dateDebut).toLocaleDateString("fr-FR")} — Épuisement
                  estimé le {new Date(d.dateEpuisementEstimee).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
