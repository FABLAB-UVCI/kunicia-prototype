import { NextResponse } from "next/server";
import { erreurApi } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import type { StatutAccouplement } from "@/lib/generated/prisma/enums";

// on remonte jusqu'aux grands-parents : suffisant pour couvrir tous les cas
// du tableau de décision (frère/sœur, parent/enfant, demi-frère/sœur, cousins) —
// au-delà, F devient négligeable ("lien lointain ou aucun")
const MAX_GENERATIONS = 2;

export type NiveauAlerte = "FORTE" | "ALERTE" | "MODEREE" | "AUCUNE";

export function determinerNiveauAlerte(f: number): NiveauAlerte {
  if (f >= 0.25) return "FORTE";
  if (f >= 0.125) return "ALERTE";
  if (f >= 0.03) return "MODEREE";
  return "AUCUNE";
}

// l'ownership d'un accouplement passe par le mâle
export function trouverAccouplementOwned(eleveurId: string, id: string) {
  return prisma.accouplement.findFirst({ where: { id, male: { eleveurId } } });
}

export function assertEnAttente(statut: string): NextResponse | null {
  if (statut !== "EN_ATTENTE") {
    return erreurApi(
      409,
      "Cet accouplement a déjà été traité (validé ou annulé)",
    );
  }
  return null;
}

export async function trouverEtValiderCouple(
  eleveurId: string,
  maleId: string,
  femelleId: string,
): Promise<NextResponse | { male: { codeIdentification: string }; femelle: { codeIdentification: string } }> {
  if (maleId === femelleId) {
    return erreurApi(
      400,
      "Le mâle et la femelle doivent être des lapins différents",
    );
  }

  const [male, femelle] = await Promise.all([
    prisma.lapin.findFirst({ where: { id: maleId, eleveurId } }),
    prisma.lapin.findFirst({ where: { id: femelleId, eleveurId } }),
  ]);

  if (!male || !femelle) {
    return erreurApi(404, "Lapin introuvable");
  }

  for (const lapin of [male, femelle]) {
    if (!lapin.identifie) {
      return erreurApi(
        409,
        `Le lapin ${lapin.codeIdentification} n'est pas encore identifié (race/sexe/date de naissance manquants)`,
      );
    }
  }

  if (male.sexe !== "MALE") {
    return erreurApi(400, "maleId doit désigner un lapin de sexe MALE");
  }

  if (femelle.sexe !== "FEMELLE") {
    return erreurApi(400, "femelleId doit désigner un lapin de sexe FEMELLE");
  }

  for (const lapin of [male, femelle]) {
    if (lapin.statut === "DECEDE" || lapin.statut === "VENDU") {
      return erreurApi(
        409,
        `Le lapin ${lapin.codeIdentification} est décédé ou vendu`,
      );
    }
  }

  // seule la femelle est bloquée par un cycle en cours : un mâle reste
  // disponible pour d'autres accouplements même après validation
  if (femelle.statut === "EN_GESTATION" || femelle.statut === "ALLAITEMENT") {
    return erreurApi(
      409,
      `La femelle ${femelle.codeIdentification} n'est pas disponible (en gestation ou en allaitement) — attends la confirmation du sevrage`,
    );
  }

  return { male, femelle };
}

// calcule le coefficient de Wright ET dérive un libellé du lien de parenté
// (frère/sœur, cousins...) à partir des MÊMES ancêtres communs — le
// coefficient seul ne suffit pas à distinguer certains cas (un
// demi-frère/sœur et un couple oncle/nièce donnent tous deux F=0,125), d'où
// la nécessité de regarder directement les distances généalogiques
export async function analyserParente(
  maleId: string,
  femelleId: string,
): Promise<{ coefficient: number; typeParente: string | null }> {
  const [ancetresMale, ancetresFemelle] = await Promise.all([
    getAncestorsMap(maleId, MAX_GENERATIONS),
    getAncestorsMap(femelleId, MAX_GENERATIONS),
  ]);

  let coefficient = 0;
  const ancetresCommuns: { n1: number; n2: number }[] = [];
  for (const [ancetreId, n1] of ancetresMale) {
    const n2 = ancetresFemelle.get(ancetreId);
    if (n2 !== undefined) {
      coefficient += Math.pow(0.5, n1 + n2 + 1);
      ancetresCommuns.push({ n1, n2 });
    }
  }

  return {
    coefficient,
    typeParente: libelleTypeParente(ancetresCommuns),
  };
}

function libelleTypeParente(
  ancetresCommuns: { n1: number; n2: number }[],
): string | null {
  if (ancetresCommuns.length === 0) return null;

  // l'un est un ancêtre direct de l'autre (distance 0 → 1)
  if (
    ancetresCommuns.some(
      (a) => (a.n1 === 0 && a.n2 === 1) || (a.n1 === 1 && a.n2 === 0),
    )
  ) {
    return "Parent et enfant";
  }

  const parentsCommuns = ancetresCommuns.filter(
    (a) => a.n1 === 1 && a.n2 === 1,
  );
  if (parentsCommuns.length >= 2) return "Frère et sœur (mêmes parents)";
  if (parentsCommuns.length === 1) {
    return "Demi-frère et demi-sœur (un seul parent commun)";
  }

  if (
    ancetresCommuns.some(
      (a) => (a.n1 === 1 && a.n2 === 2) || (a.n1 === 2 && a.n2 === 1),
    )
  ) {
    return "Oncle ou tante, et neveu ou nièce";
  }

  if (ancetresCommuns.some((a) => a.n1 === 2 && a.n2 === 2)) {
    return "Cousins germains";
  }

  return "Lien de parenté éloigné";
}

// inclut le lapin lui-même à distance 0, pour détecter aussi le cas
// parent/enfant (pas seulement frère/sœur) quand on croise les deux maps
async function getAncestorsMap(
  lapinId: string,
  maxGen: number,
): Promise<Map<string, number>> {
  const distances = new Map<string, number>([[lapinId, 0]]);
  let generationCourante = [lapinId];

  for (let gen = 1; gen <= maxGen && generationCourante.length > 0; gen++) {
    const lapins = await prisma.lapin.findMany({
      where: { id: { in: generationCourante } },
      select: { pereId: true, mereId: true },
    });

    const generationSuivante: string[] = [];
    for (const lapin of lapins) {
      for (const parentId of [lapin.pereId, lapin.mereId]) {
        if (!parentId) continue;
        if (!distances.has(parentId)) {
          distances.set(parentId, gen);
        }
        generationSuivante.push(parentId);
      }
    }
    generationCourante = generationSuivante;
  }

  return distances;
}

// applique la décision de validation (en transaction) et met à jour les
// statuts des deux lapins : mâle reproducteur, femelle en gestation
export async function confirmerAccouplement(
  accouplement: { id: string; maleId: string; femelleId: string },
  statutCible: StatutAccouplement,
  motif?: string,
): Promise<NextResponse | Awaited<ReturnType<typeof prisma.accouplement.update>>> {
  const [male, femelle] = await Promise.all([
    prisma.lapin.findUnique({ where: { id: accouplement.maleId } }),
    prisma.lapin.findUnique({ where: { id: accouplement.femelleId } }),
  ]);

  if (!male || !femelle) {
    return erreurApi(404, "Lapin introuvable");
  }

  for (const lapin of [male, femelle]) {
    if (lapin.statut === "DECEDE" || lapin.statut === "VENDU") {
      return erreurApi(
        409,
        `Le lapin ${lapin.codeIdentification} est décédé ou vendu depuis la proposition`,
      );
    }
  }

  // re-vérifié ici (pas seulement à la création) : du temps a pu s'écouler
  // entre la proposition et la validation de CET accouplement
  if (femelle.statut === "EN_GESTATION" || femelle.statut === "ALLAITEMENT") {
    return erreurApi(
      409,
      `La femelle ${femelle.codeIdentification} n'est plus disponible (en gestation ou en allaitement depuis la proposition)`,
    );
  }

  const [accouplementMisAJour] = await prisma.$transaction([
    prisma.accouplement.update({
      where: { id: accouplement.id },
      data: { statut: statutCible, motifValidationForcee: motif },
    }),
    prisma.lapin.update({
      where: { id: accouplement.maleId },
      data: { statut: "REPRODUCTEUR" },
    }),
    // la femelle entre en gestation, pas simplement "reproductrice" — elle
    // ne redeviendra disponible qu'au sevrage confirmé de la portée
    prisma.lapin.update({
      where: { id: accouplement.femelleId },
      data: { statut: "EN_GESTATION" },
    }),
  ]);

  return accouplementMisAJour;
}
