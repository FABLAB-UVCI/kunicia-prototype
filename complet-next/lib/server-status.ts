type Ecouteur = () => void;

let enLigne = true;
const ecouteurs = new Set<Ecouteur>();

export function getServerStatus(): boolean {
  return enLigne;
}

export function setServerStatus(nouveauStatut: boolean): void {
  if (nouveauStatut === enLigne) return;
  enLigne = nouveauStatut;
  ecouteurs.forEach((ecouteur) => ecouteur());
}

export function subscribeServerStatus(ecouteur: Ecouteur): () => void {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
}
