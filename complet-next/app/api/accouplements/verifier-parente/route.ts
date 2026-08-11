import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import {
  analyserParente,
  determinerNiveauAlerte,
  trouverEtValiderCouple,
} from "@/lib/server/accouplement";

const querySchema = z.object({
  maleId: z.string().min(1, "maleId requis"),
  femelleId: z.string().min(1, "femelleId requis"),
});

// prévisualisation sans effet de bord : permet d'afficher l'alerte de
// consanguinité dès que le mâle et la femelle sont choisis dans le
// formulaire, avant même de soumettre la création
export async function GET(request: NextRequest) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const parse = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const couple = await trouverEtValiderCouple(
    utilisateur.id,
    parse.data.maleId,
    parse.data.femelleId,
  );
  if (couple instanceof NextResponse) return couple;

  const { coefficient, typeParente } = await analyserParente(
    parse.data.maleId,
    parse.data.femelleId,
  );

  return NextResponse.json({
    coefficientParente: coefficient,
    typeParente,
    niveauAlerte: determinerNiveauAlerte(coefficient),
  });
}
