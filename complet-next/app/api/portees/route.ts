import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { porteeSchema } from "@/lib/validation/portee";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

const querySchema = z.object({
  accouplementId: z.string().optional(),
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

  const portees = await prisma.portee.findMany({
    where: {
      accouplement: { male: { eleveurId: utilisateur.id } },
      accouplementId: parse.data.accouplementId,
    },
    include: { _count: { select: { lapins: true } } },
    orderBy: { dateNaissance: "desc" },
  });

  return NextResponse.json(
    portees.map(({ _count, ...portee }) => ({
      ...portee,
      nombreSevres: _count.lapins,
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

  const parse = porteeSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const accouplement = await prisma.accouplement.findFirst({
    where: { id: parse.data.accouplementId, male: { eleveurId: utilisateur.id } },
  });
  if (!accouplement) {
    return erreurApi(404, "Accouplement introuvable");
  }

  if (
    accouplement.statut !== "VALIDE" &&
    accouplement.statut !== "VALIDE_MALGRE_ALERTE"
  ) {
    return erreurApi(
      409,
      "L'accouplement doit être validé avant d'enregistrer une portée",
    );
  }

  try {
    const [portee] = await prisma.$transaction([
      prisma.portee.create({
        data: {
          accouplementId: parse.data.accouplementId,
          dateNaissance: new Date(parse.data.dateNaissance),
          nombreNes: parse.data.nombreNes,
          poidsMoyenNaissance: parse.data.poidsMoyenNaissance,
        },
      }),
      // la mise bas fait passer la femelle de "en gestation" à
      // "allaitement" — elle reste indisponible pour un nouvel
      // accouplement jusqu'au sevrage confirmé
      prisma.lapin.update({
        where: { id: accouplement.femelleId },
        data: { statut: "ALLAITEMENT" },
      }),
    ]);
    return NextResponse.json(portee, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return erreurApi(409, "Une portée existe déjà pour cet accouplement");
    }
    throw error;
  }
}
