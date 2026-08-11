import { NextRequest, NextResponse } from "next/server";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import {
  assertEnAttente,
  trouverAccouplementOwned,
} from "@/lib/server/accouplement";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const accouplement = await trouverAccouplementOwned(utilisateur.id, id);
  if (!accouplement) {
    return erreurApi(404, "Accouplement introuvable");
  }

  const dejaTraite = assertEnAttente(accouplement.statut);
  if (dejaTraite) return dejaTraite;

  const annule = await prisma.accouplement.update({
    where: { id },
    data: { statut: "ANNULE" },
  });

  return NextResponse.json(annule);
}
