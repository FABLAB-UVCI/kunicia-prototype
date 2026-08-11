import { NextRequest, NextResponse } from "next/server";
import { raceSchema } from "@/lib/validation/race";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

async function possedeRace(eleveurId: string, id: string): Promise<boolean> {
  const race = await prisma.race.findFirst({ where: { id, eleveurId } });
  return race !== null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const race = await prisma.race.findFirst({
    where: { id, eleveurId: utilisateur.id },
    include: { _count: { select: { lapins: true } } },
  });

  if (!race) {
    return erreurApi(404, "Race introuvable");
  }

  return NextResponse.json(race);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  if (!(await possedeRace(utilisateur.id, id))) {
    return erreurApi(404, "Race introuvable");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = raceSchema.partial().safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  try {
    const race = await prisma.race.update({
      where: { id },
      data: parse.data,
    });
    return NextResponse.json(race);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return erreurApi(409, "Cette race existe déjà");
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const race = await prisma.race.findFirst({
    where: { id, eleveurId: utilisateur.id },
    include: { _count: { select: { lapins: true } } },
  });

  if (!race) {
    return erreurApi(404, "Race introuvable");
  }

  if (race._count.lapins > 0) {
    return erreurApi(
      409,
      "Impossible de supprimer une race utilisée par des lapins",
    );
  }

  await prisma.race.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
