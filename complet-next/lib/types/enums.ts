export type Sexe = "MALE" | "FEMELLE";

export type StatutLapin =
  | "EN_CROISSANCE"
  | "REPRODUCTEUR"
  | "EN_GESTATION"
  | "ALLAITEMENT"
  | "VENDU"
  | "DECEDE";

export type TypeCage = "INDIVIDUELLE" | "COLLECTIVE" | "NID";

export type StatutCage = "VIDE" | "OCCUPEE" | "PLEINE" | "ALERTE_CAPACITE";

export type TypeMouvement = "ENTREE_CAGE" | "DECES" | "VENTE" | "CONTROLE";

export type StatutAccouplement =
  | "EN_ATTENTE"
  | "VALIDE"
  | "VALIDE_MALGRE_ALERTE"
  | "ANNULE";

export type NiveauAlerte = "FORTE" | "ALERTE" | "MODEREE" | "AUCUNE";
