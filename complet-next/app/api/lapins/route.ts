import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import {
  aplatirRace,
  genererCodesExterieur,
  SELECT_RACE_NOM,
} from "@/lib/server/lapin";

const statutsLapin = [
  "EN_CROISSANCE",
  "REPRODUCTEUR",
  "EN_GESTATION",
  "ALLAITEMENT",
  "VENDU",
  "DECEDE",
] as const;

// le formulaire envoie un âge en semaines que le frontend convertit en
// dateNaissance (ISO) avant l'appel — ici on valide donc la forme API
const createLapinSchema = z
  .object({
    nom: z.string().min(1).optional(),
    raceId: z.uuid("Identifiant de race invalide"),
    sexe: z.enum(["MALE", "FEMELLE"]),
    dateNaissance: z.string().min(1, "Champ requis"),
  })
  .strict();

const querySchema = z.object({
  statut: z.enum(statutsLapin).optional(),
  sexe: z.enum(["MALE", "FEMELLE"]).optional(),
  origineExterieure: z.enum(["true", "false"]).optional(),
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

  const { statut, sexe } = parse.data;
  const origineExterieure =
    parse.data.origineExterieure === undefined
      ? undefined
      : parse.data.origineExterieure === "true";

  const lapins = await prisma.lapin.findMany({
    where: { eleveurId: utilisateur.id, statut, sexe, origineExterieure },
    include: { race: SELECT_RACE_NOM },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lapins.map(aplatirRace));
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

  const parse = createLapinSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const race = await prisma.race.findFirst({
    where: { id: parse.data.raceId, eleveurId: utilisateur.id },
  });
  if (!race) {
    return erreurApi(404, "Race introuvable");
  }

  const [codeIdentification] = await genererCodesExterieur(1);

  const lapin = await prisma.lapin.create({
    data: {
      codeIdentification,
      nom: parse.data.nom,
      raceId: parse.data.raceId,
      sexe: parse.data.sexe,
      dateNaissance: new Date(parse.data.dateNaissance),
      origineExterieure: true,
      eleveurId: utilisateur.id,
    },
    include: { race: SELECT_RACE_NOM },
  });

  return NextResponse.json(aplatirRace(lapin), { status: 201 });
}
