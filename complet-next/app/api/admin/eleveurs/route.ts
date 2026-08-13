import { NextResponse } from "next/server";
import { exigerAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const administrateur = await exigerAdmin();
  if (administrateur instanceof NextResponse) return administrateur;

  const eleveurs = await prisma.utilisateur.findMany({
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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(eleveurs);
}
