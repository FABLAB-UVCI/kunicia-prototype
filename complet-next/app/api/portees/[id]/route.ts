import { NextRequest, NextResponse } from "next/server";
import { exigerSession } from "@/lib/server/auth";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import { obtenirPorteeOwned } from "@/lib/server/portee";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const { id } = await params;

  const propriete = await obtenirPorteeOwned(utilisateur.id, id);
  if (!propriete) {
    return erreurApi(404, "Portée introuvable");
  }

  const portee = await prisma.portee.findUnique({
    where: { id },
    include: {
      accouplement: {
        include: {
          male: {
            select: {
              id: true,
              codeIdentification: true,
              nom: true,
              race: { select: { nom: true } },
            },
          },
          femelle: {
            select: {
              id: true,
              codeIdentification: true,
              nom: true,
              race: { select: { nom: true } },
              // avant le sevrage, les petits n'ont pas de fiche
              // individuelle : ils vivent avec leur mère, donc la
              // localiser revient à localiser toute la portée
              cageActuelle: { select: { id: true, numero: true } },
            },
          },
        },
      },
      lapins: {
        select: {
          id: true,
          codeIdentification: true,
          nom: true,
          race: { select: { nom: true } },
          sexe: true,
          statut: true,
        },
      },
    },
  });

  if (!portee) {
    return erreurApi(404, "Portée introuvable");
  }

  return NextResponse.json({
    ...portee,
    accouplement: {
      ...portee.accouplement,
      male: {
        ...portee.accouplement.male,
        race: portee.accouplement.male.race?.nom ?? null,
      },
      femelle: {
        ...portee.accouplement.femelle,
        race: portee.accouplement.femelle.race?.nom ?? null,
      },
    },
    lapins: portee.lapins.map(({ race, ...lapin }) => ({
      ...lapin,
      race: race?.nom ?? null,
    })),
  });
}
