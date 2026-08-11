export function nomAffiche(lapin: {
  nom?: string | null;
  race: string | null;
  codeIdentification: string;
}): string {
  if (lapin.nom && lapin.race) return `${lapin.nom} — ${lapin.race}`;
  // pas encore identifié (race/nom nuls) : l'identifiant reste le seul
  // moyen de distinguer plusieurs lapins entre eux dans un sélecteur
  return lapin.race ?? lapin.nom ?? lapin.codeIdentification;
}
