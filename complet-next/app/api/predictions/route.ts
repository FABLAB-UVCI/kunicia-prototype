import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { predictionSchema } from "@/lib/validation/prediction";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import {
  calculerEcart,
  calculerEtEnregistrer,
  erreurServiceIAEnNextResponse,
  HORIZON_JOURS_DEFAUT,
  MIN_JOURS_TENDANCE_FIABLE,
  tendanceFiable,
} from "@/lib/server/prediction";

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

  const predictions = await prisma.prediction.findMany({
    where: { lapin: { eleveurId: utilisateur.id }, lapinId: parse.data.lapinId },
    orderBy: { dateCalcul: "desc" },
  });

  return NextResponse.json(
    predictions.map((prediction) => ({
      ...prediction,
      ...calculerEcart(prediction.poidsPredit, prediction.poidsReel),
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

  const parse = predictionSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const lapin = await prisma.lapin.findFirst({
    where: { id: parse.data.lapinId, eleveurId: utilisateur.id },
    include: { race: { select: { nom: true } } },
  });

  if (!lapin) {
    return erreurApi(404, "Lapin introuvable");
  }

  if (lapin.statut === "DECEDE" || lapin.statut === "VENDU") {
    return erreurApi(
      400,
      "Ce lapin est décédé ou vendu, prédiction impossible",
    );
  }

  if (!lapin.identifie || !lapin.race || !lapin.sexe || !lapin.dateNaissance) {
    return erreurApi(
      400,
      "Ce lapin n'est pas encore identifié (race, sexe, date de naissance manquants), prédiction impossible",
    );
  }

  const historique = await prisma.pesee.findMany({
    where: { lapinId: parse.data.lapinId },
    orderBy: { date: "asc" },
    select: { date: true, poids: true },
  });

  if (historique.length < 2) {
    return erreurApi(
      400,
      "Historique de pesées insuffisant pour calculer une prédiction (2 pesées minimum)",
    );
  }

  if (!tendanceFiable(historique)) {
    return erreurApi(
      400,
      `Les pesées disponibles sont trop rapprochées dans le temps pour calculer une tendance de croissance fiable (au moins ${MIN_JOURS_TENDANCE_FIABLE} jours d'écart entre la première et la dernière pesée)`,
    );
  }

  try {
    const prediction = await calculerEtEnregistrer(
      {
        id: lapin.id,
        race: lapin.race.nom,
        sexe: lapin.sexe,
        dateNaissance: lapin.dateNaissance,
      },
      historique,
      parse.data.horizonJours ?? HORIZON_JOURS_DEFAUT,
    );
    return NextResponse.json(prediction, { status: 201 });
  } catch (error) {
    const reponse = erreurServiceIAEnNextResponse(error);
    if (reponse) return reponse;
    throw error;
  }
}
