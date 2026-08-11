import { NextResponse } from "next/server";
import { exigerSession } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { calculerEcart } from "@/lib/server/prediction";

export async function GET() {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const lapins = await prisma.lapin.findMany({
    where: {
      eleveurId: utilisateur.id,
      statut: { notIn: ["DECEDE", "VENDU"] },
    },
    select: {
      id: true,
      codeIdentification: true,
      nom: true,
      predictions: {
        orderBy: { dateCalcul: "desc" },
        take: 1,
        select: { poidsPredit: true, dateEcheance: true, poidsReel: true },
      },
    },
  });

  const details = lapins.map((lapin) => {
    const derniere = lapin.predictions[0];
    return {
      lapinId: lapin.id,
      codeIdentification: lapin.codeIdentification,
      nom: lapin.nom,
      poidsPredit: derniere?.poidsPredit ?? null,
      dateEcheance: derniere?.dateEcheance ?? null,
      ...calculerEcart(
        derniere?.poidsPredit ?? null,
        derniere?.poidsReel ?? null,
      ),
    };
  });

  const poidsTotalEstime = details.reduce(
    (total, d) => total + (d.poidsPredit ?? 0),
    0,
  );

  return NextResponse.json({
    poidsTotalEstime,
    nombreLapinsAvecPrediction: details.filter((d) => d.poidsPredit !== null)
      .length,
    nombreLapinsSansPrediction: details.filter((d) => d.poidsPredit === null)
      .length,
    nombreEcartsAnormaux: details.filter((d) => d.ecartAnormal).length,
    details,
  });
}
