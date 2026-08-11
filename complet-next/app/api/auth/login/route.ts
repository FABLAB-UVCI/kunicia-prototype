import * as bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import { poserCookieSession, signerToken } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = loginSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { email: parse.data.email },
  });

  if (!utilisateur) {
    return erreurApi(401, "Identifiants invalides");
  }

  const motDePasseValide = await bcrypt.compare(
    parse.data.motDePasse,
    utilisateur.motDePasse,
  );

  if (!motDePasseValide) {
    return erreurApi(401, "Identifiants invalides");
  }

  const accessToken = await signerToken({
    sub: utilisateur.id,
    email: utilisateur.email,
  });
  await poserCookieSession(accessToken);

  return NextResponse.json({
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      nomFerme: utilisateur.nomFerme,
      email: utilisateur.email,
    },
  });
}
