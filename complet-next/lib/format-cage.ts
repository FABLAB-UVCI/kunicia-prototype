import { TypeCage } from "./types/enums";
import { LABEL_TYPE_CAGE } from "./labels";

interface CageOccupation {
  numero: string;
  type: TypeCage;
  capacite: number | null;
  nombreOccupants: number;
}

export function cageEstPleine(cage: CageOccupation): boolean {
  return cage.capacite != null && cage.nombreOccupants >= cage.capacite;
}

export function libelleCage(cage: CageOccupation): string {
  const occupation = cage.capacite
    ? `${cage.nombreOccupants}/${cage.capacite}`
    : `${cage.nombreOccupants} occupant(s)`;
  return `${cage.numero} — ${LABEL_TYPE_CAGE[cage.type]} — ${occupation}${cageEstPleine(cage) ? " (plein)" : ""}`;
}
