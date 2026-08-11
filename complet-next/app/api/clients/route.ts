import { NextRequest, NextResponse } from "next/server";
import { clientSchema } from "@/lib/validation/client";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const clients = await prisma.client.findMany({
    where: { eleveurId: utilisateur.id },
    include: { _count: { select: { ventes: true } } },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(clients);
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

  const parse = clientSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const client = await prisma.client.create({
    data: {
      nom: parse.data.nom,
      telephone: parse.data.telephone,
      adresse: parse.data.adresse,
      eleveurId: utilisateur.id,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
