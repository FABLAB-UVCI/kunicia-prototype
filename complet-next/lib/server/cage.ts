import type { CageGetPayload } from "@/lib/generated/prisma/models/Cage";

export type StatutCage = "VIDE" | "OCCUPEE" | "PLEINE" | "ALERTE_CAPACITE";

// même logique que CageService (Nest) : le statut d'une cage se calcule à la
// volée depuis le nombre d'occupants et la capacité, il n'est pas stocké en
// base. Les seuils restent des points de vigilance, pas un blocage.
export function computeStatut(
  occupantsCount: number,
  capacite: number | null,
): StatutCage {
  if (occupantsCount === 0) return "VIDE";
  if (capacite == null) return "OCCUPEE";
  if (occupantsCount > capacite) return "ALERTE_CAPACITE";
  if (occupantsCount === capacite) return "PLEINE";
  return "OCCUPEE";
}

type CageAvecCompte = CageGetPayload<{
  include: { _count: { select: { lapinsActuels: true } } };
}>;

// transforme une cage (avec compteur d'occupants) en la forme attendue par
// l'UI : mêmes champs que la réponse de CageService côté Nest
export function resumeCage(cage: CageAvecCompte) {
  const nombreOccupants = cage._count.lapinsActuels;

  return {
    id: cage.id,
    numero: cage.numero,
    type: cage.type,
    qrCode: cage.qrCode,
    capacite: cage.capacite,
    emplacement: cage.emplacement,
    createdAt: cage.createdAt,
    nombreOccupants,
    statut: computeStatut(nombreOccupants, cage.capacite),
  };
}
