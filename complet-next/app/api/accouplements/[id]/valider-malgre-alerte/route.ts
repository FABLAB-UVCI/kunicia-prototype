import { NextRequest, NextResponse } from "next/server";
import { validationForceeSchema } from "@/lib/validation/accouplement";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import {
  assertEnAttente,
  confirmerAccouplement,
  trouverAccouplementOwned,
} from "@/lib/server/accouplement";

export async function PATCH(
  request: NextRequest,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = validationForceeSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const resultat = await confirmerAccouplement(
    accouplement,
    "VALIDE_MALGRE_ALERTE",
    parse.data.motif,
  );
  if (resultat instanceof NextResponse) return resultat;

  return NextResponse.json(resultat);
}
