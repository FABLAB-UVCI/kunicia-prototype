import { NextRequest, NextResponse } from "next/server";
import { clientSchema } from "@/lib/validation/client";
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
  const parse = clientSchema.partial().safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const client = await prisma.client.findFirst({
    where: { id, eleveurId: utilisateur.id },
  });

  if (!client) {
    return erreurApi(404, "Client introuvable");
  }

  const misAJour = await prisma.client.update({
    where: { id },
    data: parse.data,
  });

  return NextResponse.json(misAJour);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, eleveurId: utilisateur.id },
    include: { _count: { select: { ventes: true } } },
  });

  if (!client) {
    return erreurApi(404, "Client introuvable");
  }

  if (client._count.ventes > 0) {
    return erreurApi(
      409,
      "Impossible de supprimer un client ayant des ventes enregistrées",
    );
  }

  await prisma.client.delete({ where: { id } });

  return NextResponse.json({});
}
