import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { santeSchema } from "@/lib/validation/sante";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

const querySchema = z.object({
  lapinId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const parse = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const suivis = await prisma.sante.findMany({
    where: { lapin: { eleveurId: utilisateur.id }, lapinId: parse.data.lapinId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(suivis);
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

  const parse = santeSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const lapin = await prisma.lapin.findFirst({
    where: { id: parse.data.lapinId, eleveurId: utilisateur.id },
  });

  if (!lapin) {
    return erreurApi(404, "Lapin introuvable");
  }

  const suivi = await prisma.sante.create({
    data: {
      lapinId: parse.data.lapinId,
      type: parse.data.type,
      date: parse.data.date ? new Date(parse.data.date) : undefined,
      dateRappel: parse.data.dateRappel
        ? new Date(parse.data.dateRappel)
        : undefined,
      notes: parse.data.notes,
    },
  });

  return NextResponse.json(suivi, { status: 201 });
}
