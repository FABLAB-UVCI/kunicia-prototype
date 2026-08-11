import { NextRequest, NextResponse } from "next/server";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const depense = await prisma.depense.findFirst({
    where: { id, eleveurId: utilisateur.id },
  });

  if (!depense) {
    return erreurApi(404, "Dépense introuvable");
  }

  await prisma.depense.delete({ where: { id } });

  return NextResponse.json({});
}
