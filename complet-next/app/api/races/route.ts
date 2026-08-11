import { NextRequest, NextResponse } from "next/server";
import { raceSchema } from "@/lib/validation/race";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

// Remplace RaceController.findAll (NestJS). Les route handlers de Next priment
// sur le rewrite /api/:path* → Nest, ce qui permet la migration module par module.
// (rewrite supprimé depuis : NestJS n'est plus utilisé.)
export async function GET() {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const races = await prisma.race.findMany({
    where: { eleveurId: utilisateur.id },
    include: { _count: { select: { lapins: true } } },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(races);
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

  const parse = raceSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  try {
    const race = await prisma.race.create({
      data: {
        nom: parse.data.nom,
        poidsAdulteMoyen: parse.data.poidsAdulteMoyen ?? null,
        paysOrigine: parse.data.paysOrigine ?? null,
        aptitude: parse.data.aptitude ?? null,
        caracteristiques: parse.data.caracteristiques ?? [],
        eleveurId: utilisateur.id,
      },
    });
    return NextResponse.json(race, { status: 201 });
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
