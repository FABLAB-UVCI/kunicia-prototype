import { Sexe } from "./types/enums";

type Ton = "neutral" | "primary" | "warning" | "danger";

export const LABEL_STATUT_CAGE: Record<string, string> = {
  VIDE: "Vide",
  OCCUPEE: "Occupé",
  PLEINE: "Plein",
  ALERTE_CAPACITE: "Alerte capacité",
};

export const TONE_STATUT_CAGE: Record<string, Ton> = {
  VIDE: "neutral",
  OCCUPEE: "primary",
  PLEINE: "warning",
  ALERTE_CAPACITE: "danger",
};

export const LABEL_STATUT_LAPIN: Record<string, string> = {
  EN_CROISSANCE: "En croissance",
  REPRODUCTEUR: "Reproducteur",
  EN_GESTATION: "En gestation",
  ALLAITEMENT: "Allaitement",
  VENDU: "Vendu",
  DECEDE: "Décédé",
};

export const TONE_STATUT_LAPIN: Record<string, Ton> = {
  EN_CROISSANCE: "neutral",
  REPRODUCTEUR: "primary",
  EN_GESTATION: "warning",
  ALLAITEMENT: "warning",
  VENDU: "warning",
  DECEDE: "danger",
};

// REPRODUCTEUR est la valeur stockée en base pour les deux sexes (cf.
// schema.prisma) — seul l'affichage distingue "Reproducteur" de
// "Reproductrice" ; EN_GESTATION/ALLAITEMENT ne concernent que les femelles,
// donc pas besoin d'accord pour ceux-là
export function libelleStatutLapin(statut: string, sexe: Sexe | null): string {
  if (statut === "REPRODUCTEUR" && sexe === "FEMELLE") return "Reproductrice";
  return LABEL_STATUT_LAPIN[statut];
}

export const LABEL_SEXE: Record<string, string> = {
  MALE: "Mâle",
  FEMELLE: "Femelle",
};

// sexe est nul pour un lapin pas encore identifié (créé en lot, en attente
// de complétion de fiche)
export function libelleSexe(sexe: Sexe | null): string {
  return sexe ? LABEL_SEXE[sexe] : "Non identifié";
}

export const LABEL_TYPE_CAGE: Record<string, string> = {
  INDIVIDUELLE: "Individuel",
  COLLECTIVE: "Collectif",
  NID: "Nid",
};

export const LABEL_STATUT_ACCOUPLEMENT: Record<string, string> = {
  EN_ATTENTE: "En attente",
  VALIDE: "Validé",
  VALIDE_MALGRE_ALERTE: "Validé malgré alerte",
  ANNULE: "Annulé",
};

export const TONE_STATUT_ACCOUPLEMENT: Record<string, Ton> = {
  EN_ATTENTE: "neutral",
  VALIDE: "primary",
  VALIDE_MALGRE_ALERTE: "warning",
  ANNULE: "danger",
};

export const LABEL_NIVEAU_ALERTE: Record<string, string> = {
  AUCUNE: "OK",
  MODEREE: "Alerte modérée",
  ALERTE: "Alerte",
  FORTE: "Alerte forte",
};

export const TONE_NIVEAU_ALERTE: Record<string, Ton> = {
  AUCUNE: "primary",
  MODEREE: "warning",
  ALERTE: "warning",
  FORTE: "danger",
};

export const LABEL_TYPE_MOUVEMENT: Record<string, string> = {
  ENTREE_CAGE: "Entrée en clapier",
  DECES: "Décès",
  VENTE: "Vente",
  CONTROLE: "Contrôle",
};
