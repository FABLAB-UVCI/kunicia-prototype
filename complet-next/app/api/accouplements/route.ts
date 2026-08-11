import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { accouplementSchema } from "@/lib/validation/accouplement";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import {
  analyserParente,
  determinerNiveauAlerte,
  trouverEtValiderCouple,
} from "@/lib/server/accouplement";

const statutsAccouplement = [
  "EN_ATTENTE",
  "VALIDE",
  "VALIDE_MALGRE_ALERTE",
  "ANNULE",
] as const;

const querySchema = z.object({
  statut: z.enum(statutsAccouplement).optional(),
  lapinId: z.string().optional(),
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

  const accouplements = await prisma.accouplement.findMany({
    where: {
      male: { eleveurId: utilisateur.id },
      statut: parse.data.statut,
      ...(parse.data.lapinId
        ? { OR: [{ maleId: parse.data.lapinId }, { femelleId: parse.data.lapinId }] }
        : {}),
    },
    include: {
      male: {
        select: {
          id: true,
          codeIdentification: true,
          nom: true,
          race: { select: { nom: true } },
        },
      },
      femelle: {
        select: {
          id: true,
          codeIdentification: true,
          nom: true,
          race: { select: { nom: true } },
        },
      },
    },
    orderBy: { dateAccouplement: "desc" },
  });

  return NextResponse.json(
    accouplements.map((a) => ({
      ...a,
      male: { ...a.male, race: a.male.race?.nom ?? null },
      femelle: { ...a.femelle, race: a.femelle.race?.nom ?? null },
      niveauAlerte: determinerNiveauAlerte(a.coefficientParente),
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

  const parse = accouplementSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const couple = await trouverEtValiderCouple(
    utilisateur.id,
    parse.data.maleId,
    parse.data.femelleId,
  );
  if (couple instanceof NextResponse) return couple;

  const { coefficient: coefficientParente, typeParente } = await analyserParente(
    parse.data.maleId,
    parse.data.femelleId,
  );

  const accouplement = await prisma.accouplement.create({
    data: {
      maleId: parse.data.maleId,
      femelleId: parse.data.femelleId,
      dateAccouplement: new Date(parse.data.dateAccouplement),
      coefficientParente,
      typeParente,
    },
  });

  return NextResponse.json(
    {
      ...accouplement,
      niveauAlerte: determinerNiveauAlerte(coefficientParente),
    },
    { status: 201 },
  );
}
