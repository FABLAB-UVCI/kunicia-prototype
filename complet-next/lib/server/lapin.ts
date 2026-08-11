import { prisma } from "@/lib/server/prisma";

export const SELECT_RACE_NOM = { select: { nom: true } } as const;

// remplace la relation race (objet { nom }) par le nom seul, comme le faisait
// aplatirRace côté Nest — l'UI attend `race: string | null` en plus de raceId
export function aplatirRace<T extends { race: { nom: string } | null }>(
  entite: T,
): Omit<T, "race"> & { race: string | null } {
  const { race, ...reste } = entite;
  return { ...reste, race: race?.nom ?? null };
}

// compteur basé sur un COUNT, pas une séquence atomique — même simplification
// que Nest (risque de collision négligeable en usage réel : saisie manuelle,
// un seul éleveur à la fois)
export async function genererCodesExterieur(nombre: number): Promise<string[]> {
  const anneeCourte = new Date().getFullYear().toString().slice(-2);
  const nombreExistants = await prisma.lapin.count({
    where: { codeIdentification: { startsWith: "EXT-" } },
  });
  return Array.from({ length: nombre }, (_, i) => {
    const compteur = (nombreExistants + i + 1).toString().padStart(3, "0");
    return `EXT-${anneeCourte}-${compteur}`;
  });
}
