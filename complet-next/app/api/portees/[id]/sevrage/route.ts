import { NextRequest, NextResponse } from "next/server";
import { sevrageSchema } from "@/lib/validation/portee";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { obtenirPorteeOwned } from "@/lib/server/portee";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const portee = await obtenirPorteeOwned(utilisateur.id, id);
  if (!portee) {
    return erreurApi(404, "Portée introuvable");
  }

  if (portee.dateSevrage) {
    return erreurApi(409, "Le sevrage a déjà été confirmé pour cette portée");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreurApi(400, "Corps JSON invalide");
  }

  const parse = sevrageSchema.safeParse(body);
  if (!parse.success) {
    return erreurApi(400, parse.error.issues.map((issue) => issue.message));
  }

  if (parse.data.lapins.length > portee.nombreNes) {
    return erreurApi(
      400,
      "Le nombre de lapins sevrés ne peut pas dépasser le nombre de nés",
    );
  }

  const accouplement = await prisma.accouplement.findUnique({
    where: { id: portee.accouplementId },
  });
  if (!accouplement) {
    return erreurApi(404, "Accouplement introuvable");
  }

  const mere = await prisma.lapin.findUnique({
    where: { id: accouplement.femelleId },
  });
  if (!mere) {
    return erreurApi(404, "Femelle introuvable");
  }

  const anneeCourte = portee.dateNaissance.getFullYear().toString().slice(-2);
  const prefixeCode = `${mere.codeIdentification}-${anneeCourte}-`;

  // une mère peut avoir plusieurs portées la même année — la numérotation
  // doit continuer après celles déjà attribuées, sinon la 2e portée de
  // l'année reproduit les mêmes codes que la 1re (violation de contrainte
  // unique sur codeIdentification)
  const nombreExistants = await prisma.lapin.count({
    where: {
      mereId: accouplement.femelleId,
      codeIdentification: { startsWith: prefixeCode },
    },
  });

  for (const lapinDto of parse.data.lapins) {
    const race = await prisma.race.findFirst({
      where: { id: lapinDto.raceId, eleveurId: utilisateur.id },
    });
    if (!race) {
      return erreurApi(404, "Race introuvable");
    }
  }

  const lapinsACreer = parse.data.lapins.map((lapinDto, index) => {
    const numero = (nombreExistants + index + 1).toString().padStart(2, "0");
    return {
      codeIdentification: `${prefixeCode}${numero}`,
      nom: lapinDto.nom,
      raceId: lapinDto.raceId,
      sexe: lapinDto.sexe,
      dateNaissance: portee.dateNaissance,
      origineExterieure: false,
      eleveurId: utilisateur.id,
      pereId: accouplement.maleId,
      mereId: accouplement.femelleId,
      porteeId: portee.id,
    };
  });

  const [, lapinsCrees] = await prisma.$transaction([
    prisma.portee.update({
      where: { id: portee.id },
      data: { dateSevrage: new Date(parse.data.dateSevrage) },
    }),
    prisma.lapin.createManyAndReturn({ data: lapinsACreer }),
    // le sevrage confirmé libère la mère : elle redevient disponible pour
    // un nouvel accouplement
    prisma.lapin.update({
      where: { id: accouplement.femelleId },
      data: { statut: "REPRODUCTEUR" },
    }),
  ]);

  return NextResponse.json(lapinsCrees, { status: 201 });
}
