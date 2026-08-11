import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { genererCodesExterieur } from "@/lib/server/lapin";

const lotSchema = z
  .object({
    nombre: z.coerce.number().int().positive("Doit être positif"),
    cageId: z.string().optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = lotSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  if (parse.data.cageId) {
    const cage = await prisma.cage.findFirst({
      where: { id: parse.data.cageId, eleveurId: utilisateur.id },
    });
    if (!cage) {
      return erreurApi(404, "Cage introuvable");
    }
  }

  const codes = await genererCodesExterieur(parse.data.nombre);

  const lapins = await prisma.$transaction(async (tx) => {
    const crees = [];
    for (const codeIdentification of codes) {
      const lapin = await tx.lapin.create({
        data: {
          codeIdentification,
          origineExterieure: true,
          identifie: false,
          eleveurId: utilisateur.id,
          cageActuelleId: parse.data.cageId,
        },
      });
      crees.push(lapin);

      if (parse.data.cageId) {
        await tx.mouvementLapin.create({
          data: {
            lapinId: lapin.id,
            cageId: parse.data.cageId,
            typeMouvement: "ENTREE_CAGE",
          },
        });
      }
    }
    return crees;
  });

  return NextResponse.json(lapins, { status: 201 });
}
