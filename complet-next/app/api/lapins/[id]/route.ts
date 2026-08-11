import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { aplatirRace, SELECT_RACE_NOM } from "@/lib/server/lapin";

const updateLapinSchema = z
  .object({
    nom: z.string().min(1).optional(),
    raceId: z.string().optional(),
  })
  .strict();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const lapin = await prisma.lapin.findFirst({
    where: { id, eleveurId: utilisateur.id },
    include: {
      race: SELECT_RACE_NOM,
      pere: {
        select: {
          id: true,
          codeIdentification: true,
          nom: true,
          race: SELECT_RACE_NOM,
        },
      },
      mere: {
        select: {
          id: true,
          codeIdentification: true,
          nom: true,
          race: SELECT_RACE_NOM,
        },
      },
      cageActuelle: { select: { id: true, numero: true } },
      portee: { select: { id: true, dateNaissance: true } },
      _count: {
        select: {
          pesees: true,
          enfantsPaternite: true,
          enfantsMaternite: true,
        },
      },
    },
  });

  if (!lapin) {
    return erreurApi(404, "Lapin introuvable");
  }

  // pour une femelle : date du dernier sevrage confirmé parmi ses portées
  // (utile pour savoir depuis quand elle est de nouveau disponible pour un
  // accouplement) — sans objet pour un mâle, qui n'a jamais de portée en
  // tant que femelle
  const dernierePortee = await prisma.portee.findFirst({
    where: { accouplement: { femelleId: id }, dateSevrage: { not: null } },
    orderBy: { dateSevrage: "desc" },
    select: { dateSevrage: true },
  });

  return NextResponse.json({
    ...aplatirRace(lapin),
    pere: lapin.pere ? aplatirRace(lapin.pere) : null,
    mere: lapin.mere ? aplatirRace(lapin.mere) : null,
    dernierSevrage: dernierePortee?.dateSevrage ?? null,
  });
}

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = updateLapinSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  if (parse.data.raceId) {
    const race = await prisma.race.findFirst({
      where: { id: parse.data.raceId, eleveurId: utilisateur.id },
    });
    if (!race) {
      return erreurApi(404, "Race introuvable");
    }
  }

  const misAJour = await prisma.lapin.update({
    where: { id },
    data: parse.data,
    include: { race: SELECT_RACE_NOM },
  });

  return NextResponse.json(aplatirRace(misAJour));
}
