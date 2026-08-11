"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Rabbit,
  DoorClosed,
  TrendingUp,
  Heart,
  HeartPulse,
  Baby,
  Wheat,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PHOTO_BANNIERE_DASHBOARD } from "@/lib/photo-lapin";
import { SkeletonCardGrid } from "@/components/skeleton";
import { useLapins } from "@/hooks/queries/use-lapins";
import { useCages } from "@/hooks/queries/use-cages";
import { useAccouplements } from "@/hooks/queries/use-accouplements";
import { usePortees } from "@/hooks/queries/use-portees";
import { useDashboardPredictions } from "@/hooks/queries/use-predictions";
import { useStocks } from "@/hooks/queries/use-alimentation";

const NOMBRE_MOIS_AFFICHES = 12;

function derniersMois(nombre: number): { cle: string; libelle: string; finDeMois: Date }[] {
  const premierJourMoisCourant = new Date();
  premierJourMoisCourant.setDate(1);
  premierJourMoisCourant.setHours(0, 0, 0, 0);

  return Array.from({ length: nombre }, (_, i) => {
    const decalage = nombre - 1 - i;
    const debut = new Date(
      premierJourMoisCourant.getFullYear(),
      premierJourMoisCourant.getMonth() - decalage,
      1,
    );
    const finDeMois = new Date(debut.getFullYear(), debut.getMonth() + 1, 0);
    return {
      cle: `${debut.getFullYear()}-${String(debut.getMonth() + 1).padStart(2, "0")}`,
      libelle: debut.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      finDeMois,
    };
  });
}

function evolutionCheptel(
  lapins: { dateNaissance: string }[],
): { mois: string; effectif: number }[] {
  const mois = derniersMois(NOMBRE_MOIS_AFFICHES);
  const dates = lapins.map((l) => new Date(l.dateNaissance).getTime()).sort((a, b) => a - b);

  return mois.map((m) => ({
    mois: m.libelle,
    effectif: dates.filter((d) => d <= m.finDeMois.getTime()).length,
  }));
}

function reproductionsParMois(
  portees: { dateNaissance: string }[],
): { mois: string; reproductions: number }[] {
  const mois = derniersMois(NOMBRE_MOIS_AFFICHES);

  return mois.map((m) => ({
    mois: m.libelle,
    reproductions: portees.filter((p) => {
      const cle = p.dateNaissance.slice(0, 7);
      return cle === m.cle;
    }).length,
  }));
}

const TON_ICONE = {
  primary: "bg-primary/10 text-primary",
  chart2: "bg-chart-2/15 text-chart-2",
  chart3: "bg-chart-3/15 text-chart-3",
  chart4: "bg-chart-4/15 text-chart-4",
  secondary: "bg-secondary text-secondary-foreground",
  chart5: "bg-chart-5/15 text-chart-5",
} as const;

function CarteStat({
  href,
  label,
  valeur,
  detail,
  icone: Icone,
  ton,
}: {
  href: string;
  label: string;
  valeur: string;
  detail: string;
  icone: LucideIcon;
  ton: keyof typeof TON_ICONE;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${TON_ICONE[ton]}`}
          >
            <Icone className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{valeur}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: lapins, isLoading: lapinsEnChargement } = useLapins();
  const { data: cages, isLoading: cagesEnChargement } = useCages();
  const { data: accouplements } = useAccouplements();
  const { data: portees } = usePortees();
  const { data: predictions } = useDashboardPredictions();
  const { data: stocks } = useStocks();

  const enChargement = lapinsEnChargement || cagesEnChargement;

  if (enChargement) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold">Tableau de bord</h1>
        <SkeletonCardGrid count={6} />
      </div>
    );
  }

  const cheptelActif =
    lapins?.filter((l) => l.statut !== "DECEDE" && l.statut !== "VENDU").length ?? 0;
  const reproducteurs = lapins?.filter((l) => l.statut === "REPRODUCTEUR").length ?? 0;

  const cagesOccupees = cages?.filter((c) => c.statut !== "VIDE").length ?? 0;
  const cagesEnAlerte = cages?.filter((c) => c.statut === "ALERTE_CAPACITE").length ?? 0;

  const accouplementsEnAttente =
    accouplements?.filter((a) => a.statut === "EN_ATTENTE").length ?? 0;

  const lapinesEnGestation =
    lapins?.filter((l) => l.statut === "EN_GESTATION").length ?? 0;

  const lapinsAIdentifier = lapins?.filter((l) => !l.identifie).length ?? 0;

  const porteesASevrer = portees?.filter((p) => !p.dateSevrage).length ?? 0;

  const dansUneSemaine = new Date();
  dansUneSemaine.setDate(dansUneSemaine.getDate() + 7);
  const stocksARenouveler =
    stocks?.filter(
      (s) =>
        s.distributionActuelle &&
        new Date(s.distributionActuelle.dateEpuisementEstimee) <= dansUneSemaine,
    ).length ?? 0;

  const donneesCheptel = evolutionCheptel(
    (lapins ?? []).filter((l): l is typeof l & { dateNaissance: string } => l.dateNaissance !== null),
  );
  const donneesReproductions = reproductionsParMois(portees ?? []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Tableau de bord</h1>

      <div className="relative h-32 w-full overflow-hidden rounded-xl sm:h-40">
        <Image
          src={PHOTO_BANNIERE_DASHBOARD}
          alt=""
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CarteStat
          href="/lapins"
          label="Cheptel actif"
          valeur={String(cheptelActif)}
          detail={`dont ${reproducteurs} reproducteur${reproducteurs > 1 ? "s" : ""}`}
          icone={Rabbit}
          ton="primary"
        />
        <CarteStat
          href="/lapins"
          label="Lapins à identifier"
          valeur={String(lapinsAIdentifier)}
          detail="Race, sexe, date de naissance à compléter"
          icone={Fingerprint}
          ton="chart5"
        />
        <CarteStat
          href="/cages"
          label="Clapiers occupés"
          valeur={`${cagesOccupees}/${cages?.length ?? 0}`}
          detail={
            cagesEnAlerte > 0
              ? `${cagesEnAlerte} en alerte de capacité`
              : "Aucune alerte de capacité"
          }
          icone={DoorClosed}
          ton="chart2"
        />
        <CarteStat
          href="/predictions"
          label="Poids total estimé"
          valeur={predictions ? `${predictions.poidsTotalEstime.toFixed(1)} kg` : "—"}
          detail={
            predictions && predictions.nombreEcartsAnormaux > 0
              ? `${predictions.nombreEcartsAnormaux} écart${
                  predictions.nombreEcartsAnormaux > 1 ? "s" : ""
                } anormal${predictions.nombreEcartsAnormaux > 1 ? "aux" : ""}`
              : `${predictions?.nombreLapinsSansPrediction ?? 0} lapin${
                  (predictions?.nombreLapinsSansPrediction ?? 0) > 1 ? "s" : ""
                } sans prédiction`
          }
          icone={TrendingUp}
          ton="chart3"
        />
        <CarteStat
          href="/accouplements"
          label="Accouplements en attente"
          valeur={String(accouplementsEnAttente)}
          detail="À valider ou annuler"
          icone={Heart}
          ton="chart4"
        />
        <CarteStat
          href="/lapins"
          label="Lapines en gestation"
          valeur={String(lapinesEnGestation)}
          detail="Mise bas attendue"
          icone={HeartPulse}
          ton="chart4"
        />
        <CarteStat
          href="/portees"
          label="Reproductions à sevrer"
          valeur={String(porteesASevrer)}
          detail="Sevrage non confirmé"
          icone={Baby}
          ton="secondary"
        />
        <CarteStat
          href="/alimentation"
          label="Stocks à renouveler bientôt"
          valeur={String(stocksARenouveler)}
          detail="Épuisement estimé sous 7 jours"
          icone={Wheat}
          ton="chart5"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Évolution du cheptel</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donneesCheptel}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} width={30} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="effectif"
                  name="Effectif cumulé"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reproductions par mois</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donneesReproductions}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} width={30} />
                <Tooltip />
                <Bar
                  dataKey="reproductions"
                  name="Reproductions"
                  fill="var(--chart-4)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
