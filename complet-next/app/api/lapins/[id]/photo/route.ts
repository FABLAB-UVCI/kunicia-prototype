import { NextRequest, NextResponse } from "next/server";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { aplatirRace, SELECT_RACE_NOM } from "@/lib/server/lapin";

// servies statiquement par Next depuis public/ (pas de proxy Nest)
const DOSSIER_PHOTOS = join(process.cwd(), "public", "uploads", "lapins");
const TAILLE_MAX_PHOTO = 5 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const lapin = await prisma.lapin.findFirst({
    where: { id, eleveurId: utilisateur.id },
  });
  if (!lapin) {
    return erreurApi(404, "Lapin introuvable");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return erreurApi(400, "Corps multipart invalide");
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File)) {
    return erreurApi(400, "Aucune photo reçue");
  }
  if (!photo.type.startsWith("image/")) {
    return erreurApi(400, "Le fichier doit être une image");
  }
  if (photo.size > TAILLE_MAX_PHOTO) {
    return erreurApi(400, "La photo ne doit pas dépasser 5 Mo");
  }

  // même nom de fichier à chaque upload pour un même lapin (écrase l'ancienne
  // photo au lieu d'en accumuler une nouvelle à chaque remplacement)
  const extension = extname(photo.name) || ".jpg";
  const nomFichier = `${id}${extension}`;

  mkdirSync(DOSSIER_PHOTOS, { recursive: true });
  await writeFile(
    join(DOSSIER_PHOTOS, nomFichier),
    Buffer.from(await photo.arrayBuffer()),
  );

  const misAJour = await prisma.lapin.update({
    where: { id },
    data: { photoUrl: `/uploads/lapins/${nomFichier}` },
    include: { race: SELECT_RACE_NOM },
  });

  return NextResponse.json(aplatirRace(misAJour));
}
