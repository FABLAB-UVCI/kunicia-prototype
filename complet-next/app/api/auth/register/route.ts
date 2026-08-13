import * as bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { poserCookieSession, signerToken } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

// même règle que RegisterDto (Nest) : whitelist + rejet des champs inconnus
// (d'où .strict()) ; confirmationMotDePasse n'existe que dans le formulaire,
// pas dans l'API
const registerSchema = z
  .object({
    nom: z.string().min(1, "Le nom est requis"),
    nomFerme: z.string().min(1, "Le nom de la ferme est requis"),
    email: z.string().email("Adresse email invalide"),
    motDePasse: z.string().min(8, "8 caractères minimum"),
  })
  .strict();

const SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = registerSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  const motDePasseHash = await bcrypt.hash(parse.data.motDePasse, SALT_ROUNDS);

  try {
    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom: parse.data.nom,
        nomFerme: parse.data.nomFerme,
        email: parse.data.email,
        motDePasse: motDePasseHash,
      },
      select: { id: true, nom: true, nomFerme: true, email: true, role: true, actif: true },
    });

    const accessToken = await signerToken({
      sub: utilisateur.id,
      email: utilisateur.email,
    });
    await poserCookieSession(accessToken);

    return NextResponse.json({ utilisateur }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return erreurApi(409, "Un compte existe déjà avec cet email");
    }
    throw error;
  }
}
