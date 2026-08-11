import { NextRequest, NextResponse } from "next/server";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import {
  assertEnAttente,
  confirmerAccouplement,
  determinerNiveauAlerte,
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

  const niveau = determinerNiveauAlerte(accouplement.coefficientParente);
  if (niveau !== "AUCUNE") {
    return erreurApi(
      409,
      "Ce couple présente un risque de consanguinité : utilisez la validation forcée (avec motif) ou annulez",
    );
  }

  const resultat = await confirmerAccouplement(accouplement, "VALIDE");
  if (resultat instanceof NextResponse) return resultat;

  return NextResponse.json(resultat);
}
