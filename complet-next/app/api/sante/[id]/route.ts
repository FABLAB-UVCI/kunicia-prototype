import { NextRequest, NextResponse } from "next/server";
import { santeEditSchema } from "@/lib/validation/sante";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  // les champs modifiables peuvent être envoyés partiellement (PATCH)
  const parse = santeEditSchema.partial().safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const suivi = await prisma.sante.findFirst({
    where: { id, lapin: { eleveurId: utilisateur.id } },
  });

  if (!suivi) {
    return erreurApi(404, "Suivi santé introuvable");
  }

  const misAJour = await prisma.sante.update({
    where: { id },
    data: {
      type: parse.data.type,
      date: parse.data.date ? new Date(parse.data.date) : undefined,
      dateRappel: parse.data.dateRappel
        ? new Date(parse.data.dateRappel)
        : undefined,
      notes: parse.data.notes,
    },
  });

  return NextResponse.json(misAJour);
}
