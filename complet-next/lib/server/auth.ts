import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AuthUser } from "@/lib/types/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

// La session voyage en cookie httpOnly (pas de header Authorization) :
// invisible au JavaScript de la page, et retrouvée même lorsqu'un lien est
// ouvert depuis une autre application (scan d'un QR code par la caméra).
export const NOM_COOKIE_SESSION = "cunicole_session";

// doit rester cohérent avec JWT_EXPIRES_IN (cf. .env.local) : le cookie ne
// doit pas expirer avant le jeton qu'il contient
export const DUREE_COOKIE_MS = 3650 * 24 * 60 * 60 * 1000;

const OPTIONS_COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

export interface JwtPayload extends JWTPayload {
  sub: string;
  email: string;
}

function secret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function signerToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "3650d")
    .sign(secret());
}

export async function poserCookieSession(accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(NOM_COOKIE_SESSION, accessToken, {
    ...OPTIONS_COOKIE,
    maxAge: Math.floor(DUREE_COOKIE_MS / 1000),
  });
}

export async function supprimerCookieSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(NOM_COOKIE_SESSION);
}

// lit le cookie httpOnly, vérifie le jeton puis recharge l'utilisateur en DB.
// null = pas de session valide (état normal pour /auth/me).
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOM_COOKIE_SESSION)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: payload.sub as string },
      select: { id: true, nom: true, nomFerme: true, email: true },
    });
    return utilisateur;
  } catch {
    return null;
  }
}

// pour les routes protégées : renvoie l'utilisateur, ou une réponse 401 à
// renvoyer telle quelle si la session est invalide
export async function exigerSession(): Promise<AuthUser | NextResponse> {
  const utilisateur = await getSessionUser();
  if (!utilisateur) {
    return erreurApi(401, "Non authentifié");
  }
  return utilisateur;
}
