import { NextRequest, NextResponse } from "next/server";
import { depenseSchema } from "@/lib/validation/depense";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const depenses = await prisma.depense.findMany({
    where: { eleveurId: utilisateur.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(depenses);
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

  const parse = depenseSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const depense = await prisma.depense.create({
    data: {
      categorie: parse.data.categorie,
      libelle: parse.data.libelle,
      montant: parse.data.montant,
      date: parse.data.date ? new Date(parse.data.date) : undefined,
      eleveurId: utilisateur.id,
    },
  });

  return NextResponse.json(depense, { status: 201 });
}
