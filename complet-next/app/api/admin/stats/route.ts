import { NextResponse } from "next/server";
import { exigerAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

const NOMBRE_MOIS_AFFICHES = 12;

function cleMois(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const administrateur = await exigerAdmin();
  if (administrateur instanceof NextResponse) return administrateur;

  const [
    utilisateurs,
    lapinsParSexe,
    totalLapins,
    cages,
    races,
    clients,
    ventes,
    pesees,
    portees,
    predictions,
    depenses,
  ] = await Promise.all([
    prisma.utilisateur.findMany({
      select: { role: true, actif: true, createdAt: true },
    }),
    prisma.lapin.groupBy({ by: ["sexe"], _count: { _all: true } }),
    prisma.lapin.count(),
    prisma.cage.count(),
    prisma.race.count(),
    prisma.client.count(),
    prisma.vente.aggregate({ _count: { _all: true }, _sum: { prix: true } }),
    prisma.pesee.count(),
    prisma.portee.count(),
    prisma.prediction.count(),
    prisma.depense.aggregate({ _count: { _all: true }, _sum: { montant: true } }),
  ]);

  const eleveurs = utilisateurs.filter((u) => u.role === "ELEVEUR");
  const admins = utilisateurs.length - eleveurs.length;

  const maintenant = new Date();
  const moisCles = Array.from({ length: NOMBRE_MOIS_AFFICHES }, (_, i) => {
    const debut = new Date(
      maintenant.getFullYear(),
      maintenant.getMonth() - (NOMBRE_MOIS_AFFICHES - 1 - i),
      1,
    );
    return cleMois(debut);
  });
  const compteurInscriptions = new Map<string, number>(moisCles.map((m) => [m, 0]));
  for (const u of eleveurs) {
    const cle = cleMois(u.createdAt);
    if (compteurInscriptions.has(cle)) {
      compteurInscriptions.set(cle, compteurInscriptions.get(cle)! + 1);
    }
  }

  const parSexe = (sexe: "MALE" | "FEMELLE") =>
    lapinsParSexe.find((l) => l.sexe === sexe)?._count._all ?? 0;

  return NextResponse.json({
    eleveurs: {
      total: eleveurs.length,
      actifs: eleveurs.filter((u) => u.actif).length,
      desactives: eleveurs.filter((u) => !u.actif).length,
      admins,
    },
    lapins: {
      total: totalLapins,
      males: parSexe("MALE"),
      femelles: parSexe("FEMELLE"),
    },
    cages,
    races,
    clients,
    ventes: { nombre: ventes._count._all, chiffreAffaires: ventes._sum.prix ?? 0 },
    pesees,
    portees,
    predictions,
    depenses: { nombre: depenses._count._all, total: depenses._sum.montant ?? 0 },
    inscriptionsParMois: moisCles.map((mois) => ({
      mois,
      total: compteurInscriptions.get(mois)!,
    })),
  });
}
