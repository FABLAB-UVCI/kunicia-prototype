"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dna,
  Rabbit,
  ShoppingCart,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCardGrid } from "@/components/skeleton";
import { useStatsAdmin } from "@/hooks/queries/use-administration";

const TON_ICONE = {
  primary: "bg-primary/10 text-primary",
  chart2: "bg-chart-2/15 text-chart-2",
  chart3: "bg-chart-3/15 text-chart-3",
  chart4: "bg-chart-4/15 text-chart-4",
  secondary: "bg-secondary text-secondary-foreground",
  chart5: "bg-chart-5/15 text-chart-5",
} as const;

function CarteStat({
  label,
  valeur,
  detail,
  icone: Icone,
  ton,
}: {
  label: string;
  valeur: string;
  detail: string;
  icone: LucideIcon;
  ton: keyof typeof TON_ICONE;
}) {
  return (
    <Card className="min-w-40 flex-1">
      <CardContent className="flex items-center gap-2.5 px-2.5 pt-0.5 pb-2.5">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-md ${TON_ICONE[ton]}`}
        >
          <Icone className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-lg leading-tight font-semibold">{valeur}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formaterMontant(valeur: number): string {
  return valeur.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

export default function AdminStatsPage() {
  const { data: stats, isLoading } = useStatsAdmin();

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold">Statistiques de la plateforme</h1>
        <SkeletonCardGrid count={6} />
      </div>
    );
  }

  const donneesInscriptions = stats.inscriptionsParMois.map((point) => ({
    ...point,
    libelle: format(new Date(`${point.mois}-01`), "MMM yy", { locale: fr }),
  }));

  const donneesEvolutionComptes = stats.inscriptionsParMois.reduce<
    { libelle: string; comptes: number }[]
  >((acc, point) => {
    const comptesPrecedent = acc.length > 0 ? acc[acc.length - 1].comptes : 0;
    acc.push({
      libelle: format(new Date(`${point.mois}-01`), "MMM yy", { locale: fr }),
      comptes: comptesPrecedent + point.total,
    });
    return acc;
  }, []);

  const donneesSexe = [
    { nom: "Mâles", valeur: stats.lapins.males, couleur: "var(--chart-1)" },
    { nom: "Femelles", valeur: stats.lapins.femelles, couleur: "var(--chart-3)" },
    {
      nom: "Non identifiés",
      valeur: stats.lapins.total - stats.lapins.males - stats.lapins.femelles,
      couleur: "var(--chart-5)",
    },
  ].filter((d) => d.valeur > 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Statistiques de la plateforme</h1>

      <div className="flex flex-wrap gap-3">
        <CarteStat
          label="Éleveurs inscrits"
          valeur={String(stats.eleveurs.total)}
          detail={`${stats.eleveurs.actifs} actif${
            stats.eleveurs.actifs > 1 ? "s" : ""
          }, ${stats.eleveurs.desactives} désactivé${
            stats.eleveurs.desactives > 1 ? "s" : ""
          } — ${stats.eleveurs.admins} admin${stats.eleveurs.admins > 1 ? "s" : ""}`}
          icone={UsersRound}
          ton="primary"
        />
        <CarteStat
          label="Lapins"
          valeur={String(stats.lapins.total)}
          detail={`${stats.lapins.males} mâles, ${stats.lapins.femelles} femelles`}
          icone={Rabbit}
          ton="primary"
        />
        <CarteStat
          label="Races référencées"
          valeur={String(stats.races)}
          detail="Créées par les éleveurs"
          icone={Dna}
          ton="chart5"
        />
        <CarteStat
          label="Ventes"
          valeur={String(stats.ventes.nombre)}
          detail={`CA total : ${formaterMontant(stats.ventes.chiffreAffaires)}`}
          icone={ShoppingCart}
          ton="chart4"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Évolution des comptes inscrits</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donneesEvolutionComptes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="libelle" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} width={30} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="comptes"
                  name="Comptes cumulés"
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
            <CardTitle className="text-base">Inscriptions d&apos;éleveurs par mois</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donneesInscriptions}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="libelle" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} width={30} />
                <Tooltip />
                <Bar
                  dataKey="total"
                  name="Inscriptions"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des lapins par sexe</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {donneesSexe.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donneesSexe}
                    dataKey="valeur"
                    nameKey="nom"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {donneesSexe.map((entree) => (
                      <Cell key={entree.nom} fill={entree.couleur} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun lapin enregistré.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
