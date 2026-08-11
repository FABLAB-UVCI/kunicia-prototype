import { NextResponse } from "next/server";
import { exigerSession } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import {
  calculerEtEnregistrer,
  HORIZON_JOURS_DEFAUT,
  tendanceFiable,
} from "@/lib/server/prediction";

// lance le calcul pour tout le cheptel actif d'un coup, plutôt que lapin
// par lapin — les lapins avec un historique insuffisant ou trop rapproché
// dans le temps sont ignorés silencieusement (ce n'est pas une demande
// explicite sur CE lapin), et un échec sur l'un n'empêche pas les autres
// (Promise.allSettled)
export async function POST() {
  const utilisateur = await exigerSession();
  if (utilisateur instanceof NextResponse) return utilisateur;

  const lapins = await prisma.lapin.findMany({
    where: {
      eleveurId: utilisateur.id,
      statut: { notIn: ["DECEDE", "VENDU"] },
    },
    include: {
      race: { select: { nom: true } },
      pesees: {
        orderBy: { date: "asc" },
        select: { date: true, poids: true },
      },
    },
  });

  const eligibles = lapins.filter(
    (lapin) =>
      lapin.identifie &&
      lapin.race &&
      lapin.sexe &&
      lapin.dateNaissance &&
      lapin.pesees.length >= 2 &&
      tendanceFiable(lapin.pesees),
  );
  const ignores = lapins.length - eligibles.length;

  const resultats = await Promise.allSettled(
    eligibles.map((lapin) =>
      calculerEtEnregistrer(
        {
          id: lapin.id,
          race: lapin.race!.nom,
          sexe: lapin.sexe!,
          dateNaissance: lapin.dateNaissance!,
        },
        lapin.pesees,
        HORIZON_JOURS_DEFAUT,
      ),
    ),
  );

  const calculees = resultats.filter((r) => r.status === "fulfilled").length;
  const echecs = resultats.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    nombreCalculees: calculees,
    nombreIgnorees: ignores,
    nombreEchecs: echecs,
  });
}
