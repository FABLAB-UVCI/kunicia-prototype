import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { peseeSchema } from "@/lib/validation/pesee";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

const querySchema = z.object({
  lapinId: z.string().optional(),
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

  const pesees = await prisma.pesee.findMany({
    where: { lapin: { eleveurId: utilisateur.id }, lapinId: parse.data.lapinId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(pesees);
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

  const parse = peseeSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const lapin = await prisma.lapin.findFirst({
    where: { id: parse.data.lapinId, eleveurId: utilisateur.id },
  });

  if (!lapin) {
    return erreurApi(404, "Lapin introuvable");
  }

  if (lapin.statut === "DECEDE" || lapin.statut === "VENDU") {
    return erreurApi(409, "Ce lapin est décédé ou vendu, aucune pesée possible");
  }

  const date = parse.data.date ? new Date(parse.data.date) : new Date();

  const pesee = await prisma.$transaction(async (tx) => {
    const pesee = await tx.pesee.create({
      data: { lapinId: parse.data.lapinId, poids: parse.data.poids, date },
    });

    // auto-remplissage : complète la prédiction en attente la plus récente
    // dont l'échéance est passée — si le lapin est mort/vendu avant son
    // échéance, la prédiction reste simplement à poidsReel=null pour
    // toujours, naturellement exclue de tout calcul de fiabilité
    const predictionEnAttente = await tx.prediction.findFirst({
      where: {
        lapinId: parse.data.lapinId,
        poidsReel: null,
        dateEcheance: { lte: date },
      },
      orderBy: { dateEcheance: "desc" },
    });

    if (predictionEnAttente) {
      await tx.prediction.update({
        where: { id: predictionEnAttente.id },
        data: { poidsReel: parse.data.poids },
      });
    }

    return pesee;
  });

  return NextResponse.json(pesee, { status: 201 });
}
