// Durée de gestation de la lapine : une constante biologique bien établie
// (28 à 35 jours), pas une valeur à apprendre depuis l'historique de la
// ferme — trop peu de recul sur une seule exploitation pour que ce soit
// statistiquement exploitable, contrairement au poids de croissance.
const GESTATION_MIN_JOURS = 28;
const GESTATION_MAX_JOURS = 35;

export interface PeriodeGestation {
  debut: Date;
  fin: Date;
}

export function periodeGestationAttendue(dateAccouplement: string | Date): PeriodeGestation {
  const base = new Date(dateAccouplement);

  const debut = new Date(base);
  debut.setDate(debut.getDate() + GESTATION_MIN_JOURS);

  const fin = new Date(base);
  fin.setDate(fin.getDate() + GESTATION_MAX_JOURS);

  return { debut, fin };
}

export function libellePeriodeGestation(dateAccouplement: string | Date): string {
  const { debut, fin } = periodeGestationAttendue(dateAccouplement);
  const format = (d: Date) => d.toLocaleDateString("fr-FR");
  return `Mise bas attendue entre le ${format(debut)} et le ${format(fin)}`;
}
