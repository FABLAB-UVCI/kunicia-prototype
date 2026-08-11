import { NextRequest, NextResponse } from "next/server";
import { venteSchema } from "@/lib/validation/vente";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

const SELECT_LAPIN_RESUME = {
  select: {
    id: true,
    codeIdentification: true,
    nom: true,
    race: { select: { nom: true } },
  },
} as const;

export async function GET() {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const ventes = await prisma.vente.findMany({
    where: { eleveurId: utilisateur.id },
    include: {
      lapin: SELECT_LAPIN_RESUME,
      client: { select: { id: true, nom: true } },
    },
    orderBy: { dateVente: "desc" },
  });

  return NextResponse.json(
    ventes.map(({ lapin, ...vente }) => ({
      ...vente,
      lapin: { ...lapin, race: lapin.race?.nom ?? null },
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

  const parse = venteSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const lapin = await prisma.lapin.findFirst({
    where: { id: parse.data.lapinId, eleveurId: utilisateur.id },
  });

  if (!lapin) {
    return erreurApi(404, "Lapin introuvable");
  }

  if (lapin.statut === "DECEDE" || lapin.statut === "VENDU") {
    return erreurApi(409, "Ce lapin est déjà décédé ou vendu");
  }

  if (!lapin.identifie) {
    return erreurApi(
      409,
      "Ce lapin doit être identifié (race, sexe, date de naissance) avant de pouvoir être vendu",
    );
  }

  if (parse.data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parse.data.clientId, eleveurId: utilisateur.id },
    });
    if (!client) {
      return erreurApi(404, "Client introuvable");
    }
  }

  const dateVente = parse.data.dateVente
    ? new Date(parse.data.dateVente)
    : new Date();

  const [vente] = await prisma.$transaction([
    prisma.vente.create({
      data: {
        lapinId: parse.data.lapinId,
        clientId: parse.data.clientId,
        prix: parse.data.prix,
        dateVente,
        eleveurId: utilisateur.id,
      },
      include: {
        lapin: SELECT_LAPIN_RESUME,
        client: { select: { id: true, nom: true } },
      },
    }),
    prisma.mouvementLapin.create({
      data: {
        lapinId: parse.data.lapinId,
        typeMouvement: "VENTE",
        dateMouvement: dateVente,
      },
    }),
    prisma.lapin.update({
      where: { id: parse.data.lapinId },
      data: { statut: "VENDU", cageActuelleId: null },
    }),
  ]);

  const { race, ...lapinResume } = vente.lapin;
  return NextResponse.json(
    { ...vente, lapin: { ...lapinResume, race: race?.nom ?? null } },
    { status: 201 },
  );
}
