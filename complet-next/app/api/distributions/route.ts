import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { distributionSchema } from "@/lib/validation/alimentation";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { estimerQuantiteRestante } from "@/lib/server/alimentation";

const MS_PAR_JOUR = 1000 * 60 * 60 * 24;

const querySchema = z.object({
  stockId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const parse = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const distributions = await prisma.distributionAlimentation.findMany({
    where: { stock: { eleveurId: utilisateur.id }, stockId: parse.data.stockId },
    orderBy: { dateDebut: "desc" },
  });

  return NextResponse.json(distributions);
}

export async function POST(request: NextRequest) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = distributionSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const stock = await prisma.stockAlimentation.findFirst({
    where: { id: parse.data.stockId, eleveurId: utilisateur.id },
  });
  if (!stock) {
    return erreurApi(404, "Stock introuvable");
  }

  if (parse.data.cageId) {
    const cage = await prisma.cage.findFirst({
      where: { id: parse.data.cageId, eleveurId: utilisateur.id },
    });
    if (!cage) {
      return erreurApi(404, "Cage introuvable");
    }
  }

  // le dernier événement de distribution pour CE stock détermine le rythme
  // de consommation en vigueur jusqu'ici ; la nouvelle distribution
  // remplace ce rythme à partir de dateDebut
  const derniereDistribution =
    await prisma.distributionAlimentation.findFirst({
      where: { stockId: parse.data.stockId },
      orderBy: { dateDebut: "desc" },
    });

  const dateDebut = parse.data.dateDebut ? new Date(parse.data.dateDebut) : new Date();
  const consommationJournaliere = parse.data.quantiteParJour * parse.data.nombreLapins;

  const quantiteRestante = derniereDistribution
    ? estimerQuantiteRestante(
        stock.quantiteRestante,
        derniereDistribution,
        dateDebut,
      )
    : stock.quantiteRestante;

  const joursRestants = quantiteRestante / consommationJournaliere;
  const dateEpuisementEstimee = new Date(
    dateDebut.getTime() + joursRestants * MS_PAR_JOUR,
  );

  const [, distribution] = await prisma.$transaction([
    prisma.stockAlimentation.update({
      where: { id: stock.id },
      data: { quantiteRestante },
    }),
    prisma.distributionAlimentation.create({
      data: {
        stockId: parse.data.stockId,
        cageId: parse.data.cageId,
        quantiteParJour: parse.data.quantiteParJour,
        nombreLapins: parse.data.nombreLapins,
        dateDebut,
        consommationJournaliere,
        dateEpuisementEstimee,
      },
    }),
  ]);

  return NextResponse.json(distribution, { status: 201 });
}
