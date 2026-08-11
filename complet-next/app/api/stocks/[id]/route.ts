import { NextRequest, NextResponse } from "next/server";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { estimerQuantiteRestante } from "@/lib/server/alimentation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const stock = await prisma.stockAlimentation.findFirst({
    where: { id, eleveurId: utilisateur.id },
    include: { distributions: { orderBy: { dateDebut: "desc" } } },
  });

  if (!stock) {
    return erreurApi(404, "Stock introuvable");
  }

  const derniereDistribution = stock.distributions[0];
  const quantiteRestanteEstimee = derniereDistribution
    ? estimerQuantiteRestante(stock.quantiteRestante, derniereDistribution)
    : stock.quantiteRestante;

  return NextResponse.json({ ...stock, quantiteRestanteEstimee });
}
