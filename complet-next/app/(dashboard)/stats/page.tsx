"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { SkeletonDetail } from "@/components/skeleton";
import { useLapins } from "@/hooks/queries/use-lapins";
import { usePesees } from "@/hooks/queries/use-pesees";
import { usePredictions } from "@/hooks/queries/use-predictions";
import { nomAffiche } from "@/lib/format-lapin";

interface PointCourbe {
  date: string;
  poidsReel?: number;
  poidsPredit?: number;
}

function fusionnerCourbe(
  pesees: { date: string; poids: number }[],
  predictions: { dateEcheance: string; poidsPredit: number }[],
): PointCourbe[] {
  const points = new Map<string, PointCourbe>();

  for (const p of pesees) {
    const cle = p.date.slice(0, 10);
    const point = points.get(cle) ?? { date: cle };
    point.poidsReel = p.poids;
    points.set(cle, point);
  }

  for (const pred of predictions) {
    const cle = pred.dateEcheance.slice(0, 10);
    const point = points.get(cle) ?? { date: cle };
    point.poidsPredit = pred.poidsPredit;
    points.set(cle, point);
  }

  return Array.from(points.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export default function StatsPage() {
  const { data: lapins, isLoading: lapinsEnChargement } = useLapins();
  const [lapinId, setLapinId] = useState("");

  const { data: pesees, isLoading: peseesEnChargement } = usePesees({
    lapinId: lapinId || undefined,
  });
  const { data: predictions, isLoading: predictionsEnChargement } = usePredictions({
    lapinId: lapinId || undefined,
  });

  const donnees = useMemo(
    () => fusionnerCourbe(pesees ?? [], predictions ?? []),
    [pesees, predictions],
  );

  const enChargement = peseesEnChargement || predictionsEnChargement;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Statistiques</h1>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="lapinId">Lapin</Label>
        <Select
          id="lapinId"
          value={lapinId}
          onChange={(e) => setLapinId(e.target.value)}
          disabled={lapinsEnChargement}
        >
          <option value="">Choisir un lapin</option>
          {lapins?.map((l) => (
            <option key={l.id} value={l.id}>
              {nomAffiche(l)}
            </option>
          ))}
        </Select>
      </div>

      {!lapinId && (
        <EmptyState
          title="Choisis un lapin"
          description="Sélectionne un lapin ci-dessus pour voir sa courbe de croissance réelle vs prédite."
        />
      )}

      {lapinId && enChargement && <SkeletonDetail />}

      {lapinId && !enChargement && donnees.length === 0 && (
        <EmptyState
          title="Aucune donnée"
          description="Ce lapin n'a ni pesée ni prédiction enregistrée."
        />
      )}

      {lapinId && !enChargement && donnees.length > 0 && (
        <div className="h-80 w-full rounded-lg border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={donnees}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis
                fontSize={12}
                label={{ value: "kg", angle: -90, position: "insideLeft" }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="poidsReel"
                name="Poids réel"
                stroke="var(--chart-1)"
                connectNulls
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="poidsPredit"
                name="Poids prédit"
                stroke="var(--chart-3)"
                strokeDasharray="5 5"
                connectNulls
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
