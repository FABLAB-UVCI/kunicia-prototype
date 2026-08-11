import { NextRequest, NextResponse } from "next/server";
import { stockSchema } from "@/lib/validation/alimentation";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const stocks = await prisma.stockAlimentation.findMany({
    where: { eleveurId: utilisateur.id },
    include: {
      distributions: {
        orderBy: { dateDebut: "desc" },
        take: 1,
        select: {
          dateEpuisementEstimee: true,
          consommationJournaliere: true,
        },
      },
    },
    orderBy: { dateAchat: "desc" },
  });

  return NextResponse.json(
    stocks.map(({ distributions, ...stock }) => ({
      ...stock,
      distributionActuelle: distributions[0] ?? null,
    })),
  );
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

  const parse = stockSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const stock = await prisma.stockAlimentation.create({
    data: {
      typeAliment: parse.data.typeAliment,
      quantiteInitiale: parse.data.quantiteInitiale,
      quantiteRestante: parse.data.quantiteInitiale,
      dateAchat: parse.data.dateAchat ? new Date(parse.data.dateAchat) : undefined,
      eleveurId: utilisateur.id,
    },
  });

  return NextResponse.json(stock, { status: 201 });
}
