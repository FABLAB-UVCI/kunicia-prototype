import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mouvementSchema } from "@/lib/validation/mouvement";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import type { StatutLapin } from "@/lib/types/enums";

const querySchema = z.object({
  lapinId: z.string().optional(),
  cageId: z.string().optional(),
  typeMouvement: z
    .enum(["ENTREE_CAGE", "DECES", "VENTE", "CONTROLE"])
    .optional(),
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

  const mouvements = await prisma.mouvementLapin.findMany({
    where: {
      lapin: { eleveurId: utilisateur.id },
      lapinId: parse.data.lapinId,
      cageId: parse.data.cageId,
      typeMouvement: parse.data.typeMouvement,
    },
    orderBy: { dateMouvement: "desc" },
  });

  return NextResponse.json(mouvements);
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

  const parse = mouvementSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }
  const dto = parse.data;

  const lapin = await prisma.lapin.findFirst({
    where: { id: dto.lapinId, eleveurId: utilisateur.id },
  });

  if (!lapin) {
    return erreurApi(404, "Lapin introuvable");
  }

  if (lapin.statut === "DECEDE" || lapin.statut === "VENDU") {
    return erreurApi(
      409,
      "Ce lapin est décédé ou vendu, aucun mouvement supplémentaire possible",
    );
  }

  let cage: { id: string; capacite: number | null } | null = null;

  if (dto.typeMouvement === "ENTREE_CAGE") {
    cage = await prisma.cage.findFirst({
      where: { id: dto.cageId, eleveurId: utilisateur.id },
      select: { id: true, capacite: true },
    });

    if (!cage) {
      return erreurApi(404, "Cage introuvable");
    }
  }

  const nouveauStatut = statutApresMouvement(dto.typeMouvement, lapin.statut);
  const nouvelleCageActuelleId = cageActuelleApresMouvement(
    dto.typeMouvement,
    dto.cageId,
    lapin.cageActuelleId,
  );

  const [mouvement] = await prisma.$transaction([
    prisma.mouvementLapin.create({
      data: {
        lapinId: dto.lapinId,
        cageId: dto.typeMouvement === "ENTREE_CAGE" ? dto.cageId : null,
        typeMouvement: dto.typeMouvement,
        commentaire: dto.commentaire,
      },
    }),
    prisma.lapin.update({
      where: { id: dto.lapinId },
      data: {
        statut: nouveauStatut,
        cageActuelleId: nouvelleCageActuelleId,
      },
    }),
  ]);

  let alerteCapacite = false;
  if (cage) {
    const nombreOccupants = await prisma.lapin.count({
      where: { cageActuelleId: cage.id },
    });
    alerteCapacite = cage.capacite != null && nombreOccupants > cage.capacite;
  }

  return NextResponse.json({ ...mouvement, alerteCapacite }, { status: 201 });
}

function statutApresMouvement(
  type: "ENTREE_CAGE" | "DECES" | "VENTE" | "CONTROLE",
  statutActuel: StatutLapin,
): StatutLapin {
  if (type === "DECES") return "DECEDE";
  if (type === "VENTE") return "VENDU";
  return statutActuel;
}

function cageActuelleApresMouvement(
  type: "ENTREE_CAGE" | "DECES" | "VENTE" | "CONTROLE",
  cageId: string | undefined,
  cageActuelleActuelle: string | null,
): string | null {
  if (type === "ENTREE_CAGE") return cageId ?? null;
  if (type === "DECES" || type === "VENTE") return null;
  return cageActuelleActuelle; // CONTROLE : rien ne change
}
