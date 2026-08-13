import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigerAdmin } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

const modifierActifSchema = z
  .object({ actif: z.boolean() })
  .strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const administrateur = await exigerAdmin();
  if (administrateur instanceof NextResponse) return administrateur;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = modifierActifSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  // l'admin ne peut pas désactiver son propre compte (il se verrouillerait
  // lui-même, et il resterait sans administrateur actif)
  if (id === administrateur.id) {
    return erreurApi(400, "Impossible de modifier votre propre compte");
  }

  const eleveur = await prisma.utilisateur.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      nomFerme: true,
      email: true,
      role: true,
      actif: true,
      createdAt: true,
      _count: {
        select: {
          lapins: true,
          cages: true,
          ventes: true,
          clients: true,
          races: true,
        },
      },
    },
  });

  if (!eleveur) {
    return erreurApi(404, "Éleveur introuvable");
  }

  const misAJour = await prisma.utilisateur.update({
    where: { id },
    data: { actif: parse.data.actif },
    select: {
      id: true,
      nom: true,
      nomFerme: true,
      email: true,
      role: true,
      actif: true,
      createdAt: true,
      _count: {
        select: {
          lapins: true,
          cages: true,
          ventes: true,
          clients: true,
          races: true,
        },
      },
    },
  });

  return NextResponse.json(misAJour);
}
