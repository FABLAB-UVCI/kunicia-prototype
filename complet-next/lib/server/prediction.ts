import { NextResponse } from "next/server";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";

export const HORIZON_JOURS_DEFAUT = 14;

// seuil fixe (non paramétrable par l'éleveur), même logique que les seuils
// de consanguinité — cf. cahier des charges §4.2 (détection d'écart anormal)
const SEUIL_ECART_ANORMAL = 0.15;

// en dessous de cet écart entre la première et la dernière pesée connues, le
// taux de croissance calculé (poids / jours) devient extrêmement instable :
// deux pesées le même jour donneraient par exemple 1 kg/jour, une valeur que
// le modèle n'a jamais vue à l'entraînement et qui produit une prédiction
// non fiable
export const MIN_JOURS_TENDANCE_FIABLE = 3;

const PYTHON_API_URL = process.env.PYTHON_API_URL ?? "http://localhost:8000";

interface ReponseServiceIA {
  poidsPredit: number;
}

interface LapinPourPrediction {
  id: string;
  race: string;
  sexe: string;
  dateNaissance: Date;
}

interface PeseeHistorique {
  date: Date;
  poids: number;
}

// le service IA ne touche jamais la DB : on l'appelle via HTTP depuis le
// serveur (jamais depuis le navigateur). Une erreur devient une ErreurServiceIA
// (statut 503) pour que le cheptel puisse ignorer silencieusement les lapins
// en échec (Promise.allSettled) tout en affichant les échecs au cas par cas.
export class ErreurServiceIA extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ErreurServiceIA";
  }
}

export function erreurServiceIAEnNextResponse(error: unknown): NextResponse | null {
  if (error instanceof ErreurServiceIA) {
    return erreurApi(error.statusCode, error.message);
  }
  return null;
}

// écart entre poids prédit et poids réellement mesuré une fois la pesée
// correspondante enregistrée (cf. pesee.service.ts, auto-remplissage de
// poidsReel)
export function calculerEcart(
  poidsPredit: number | null,
  poidsReel: number | null,
): { ecartPourcentage: number | null; ecartAnormal: boolean } {
  if (poidsPredit === null || poidsReel === null) {
    return { ecartPourcentage: null, ecartAnormal: false };
  }

  const ecart = (poidsReel - poidsPredit) / poidsPredit;

  return {
    ecartPourcentage: Math.round(ecart * 1000) / 10,
    ecartAnormal: Math.abs(ecart) > SEUIL_ECART_ANORMAL,
  };
}

export function tendanceFiable(historique: PeseeHistorique[]): boolean {
  const premiere = historique[0].date;
  const derniere = historique[historique.length - 1].date;
  const joursEcart =
    (derniere.getTime() - premiere.getTime()) / (1000 * 60 * 60 * 24);
  return joursEcart >= MIN_JOURS_TENDANCE_FIABLE;
}

async function appellerServiceIA(payload: {
  race: string;
  sexe: string;
  dateNaissance: string;
  historique: { date: string; poids: number }[];
  horizonJours: number;
}): Promise<ReponseServiceIA> {
  let response: Response;
  try {
    response = await fetch(`${PYTHON_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ErreurServiceIA(
      503,
      "Le service de prédiction IA (Python) est injoignable",
    );
  }

  if (!response.ok) {
    throw new ErreurServiceIA(
      503,
      "Le service de prédiction IA a renvoyé une erreur",
    );
  }

  return response.json() as Promise<ReponseServiceIA>;
}

export async function calculerEtEnregistrer(
  lapin: LapinPourPrediction,
  historique: PeseeHistorique[],
  horizonJours: number,
) {
  const dateEcheance = new Date();
  dateEcheance.setDate(dateEcheance.getDate() + horizonJours);

  const { poidsPredit } = await appellerServiceIA({
    race: lapin.race,
    sexe: lapin.sexe,
    dateNaissance: lapin.dateNaissance.toISOString(),
    historique: historique.map((p) => ({
      date: p.date.toISOString(),
      poids: p.poids,
    })),
    horizonJours,
  });

  return prisma.prediction.create({
    data: {
      lapinId: lapin.id,
      poidsPredit,
      dateEcheance,
    },
  });
}
