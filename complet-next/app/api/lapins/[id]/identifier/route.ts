import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { aplatirRace, SELECT_RACE_NOM } from "@/lib/server/lapin";

const identifierLapinSchema = z
  .object({
    nom: z.string().min(1).optional(),
    raceId: z.uuid("Identifiant de race invalide"),
    sexe: z.enum(["MALE", "FEMELLE"]),
    dateNaissance: z.string().min(1, "Champ requis"),
  })
  .strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const lapin = await prisma.lapin.findFirst({
    where: { id, eleveurId: utilisateur.id },
  });
  if (!lapin) {
    return erreurApi(404, "Lapin introuvable");
  }

  if (lapin.identifie) {
    return erreurApi(409, "Ce lapin est déjà identifié");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = identifierLapinSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const race = await prisma.race.findFirst({
    where: { id: parse.data.raceId, eleveurId: utilisateur.id },
  });
  if (!race) {
    return erreurApi(404, "Race introuvable");
  }

  const misAJour = await prisma.lapin.update({
    where: { id },
    data: {
      nom: parse.data.nom,
      raceId: parse.data.raceId,
      sexe: parse.data.sexe,
      dateNaissance: new Date(parse.data.dateNaissance),
      identifie: true,
    },
    include: { race: SELECT_RACE_NOM },
  });

  return NextResponse.json(aplatirRace(misAJour));
}
