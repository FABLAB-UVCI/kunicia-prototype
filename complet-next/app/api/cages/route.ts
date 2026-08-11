import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cageSchema } from "@/lib/validation/cage";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { resumeCage } from "@/lib/server/cage";
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

// Remplace CageController.findAll (NestJS). Les route handlers de Next priment
// sur le rewrite /api/:path* → Nest, ce qui permet la migration module par module.
// (rewrite supprimé depuis : NestJS n'est plus utilisé.)
export async function GET() {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const cages = await prisma.cage.findMany({
    where: { eleveurId: utilisateur.id },
    include: { _count: { select: { lapinsActuels: true } } },
    orderBy: { numero: "asc" },
  });

  return NextResponse.json(cages.map(resumeCage));
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

  const parse = cageSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  // le QR code encode l'identifiant de la cage : on génère l'id nous-mêmes
  // pour pouvoir l'utiliser aussi comme valeur du QR dès la création
  const id = randomUUID();

  try {
    const cage = await prisma.cage.create({
      data: {
        id,
        qrCode: id,
        numero: parse.data.numero,
        type: parse.data.type,
        capacite: parse.data.capacite ?? null,
        emplacement: parse.data.emplacement ?? null,
        eleveurId: utilisateur.id,
      },
    });
    return NextResponse.json(cage, { status: 201 });
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
