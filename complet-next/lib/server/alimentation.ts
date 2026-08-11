const MS_PAR_JOUR = 1000 * 60 * 60 * 24;

interface DistributionRate {
  dateDebut: Date;
  consommationJournaliere: number;
}

// estime la quantité encore consommable d'un stock : on déduit de la
// quantité restante en base la consommation accumulée depuis le début de la
// distribution en cours (jamais en dessous de 0)
export function estimerQuantiteRestante(
  quantiteRestante: number,
  distribution: DistributionRate,
  aInstant: Date = new Date(),
): number {
  const joursEcoules = Math.max(
    (aInstant.getTime() - distribution.dateDebut.getTime()) / MS_PAR_JOUR,
    0,
  );
  const consomme = joursEcoules * distribution.consommationJournaliere;
  return Math.max(quantiteRestante - consomme, 0);
}
