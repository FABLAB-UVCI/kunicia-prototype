import { NextRequest, NextResponse } from "next/server";
import { cageSchema } from "@/lib/validation/cage";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { resumeCage } from "@/lib/server/cage";
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

async function possedeCage(eleveurId: string, id: string): Promise<boolean> {
  const cage = await prisma.cage.findFirst({ where: { id, eleveurId } });
  return cage !== null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const cage = await prisma.cage.findFirst({
    where: { id, eleveurId: utilisateur.id },
    include: {
      _count: { select: { lapinsActuels: true } },
      lapinsActuels: {
        select: {
          id: true,
          codeIdentification: true,
          nom: true,
          race: { select: { nom: true } },
          sexe: true,
          statut: true,
          dateNaissance: true,
        },
      },
    },
  });

  if (!cage) {
    return erreurApi(404, "Cage introuvable");
  }

  return NextResponse.json({
    ...resumeCage(cage),
    occupants: cage.lapinsActuels.map(({ race, ...lapin }) => ({
      ...lapin,
      race: race?.nom ?? null,
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  if (!(await possedeCage(utilisateur.id, id))) {
    return erreurApi(404, "Cage introuvable");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = cageSchema.partial().safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  try {
    const cage = await prisma.cage.update({
      where: { id },
      data: parse.data,
    });
    return NextResponse.json(cage);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return erreurApi(409, "Ce numéro de cage est déjà utilisé");
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

  const cage = await prisma.cage.findFirst({
    where: { id, eleveurId: utilisateur.id },
    include: { _count: { select: { lapinsActuels: true } } },
  });

  if (!cage) {
    return erreurApi(404, "Cage introuvable");
  }

  if (cage._count.lapinsActuels > 0) {
    return erreurApi(409, "Impossible de supprimer une cage occupée");
  }

  await prisma.cage.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
