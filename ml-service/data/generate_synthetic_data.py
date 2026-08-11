"""
Génère des données synthétiques de pesées de lapins (courbe de croissance de
Gompertz par race), en l'absence de données réelles d'éleveurs à ce stade du
projet — cf. cahier des charges §13, semaines 1-2.

Sortie : data/pesees_synthetiques.csv (une ligne par pesée, format long).
"""

from datetime import date, timedelta

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)

NOMBRE_LAPINS = 900
AGE_DEBUT_SUIVI_JOURS = 28  # sevrage (~4 semaines), cf. cahier des charges §8.1
AGE_FIN_SUIVI_JOURS = 280
ECART_PESEE_MOYEN_JOURS = 16
BRUIT_MESURE_RELATIF = 0.035  # imprécision de balance / manipulation (~3.5%)

# paramètres calibrés à la main pour donner une courbe de Gompertz plausible :
# poids de sevrage ~0.6-0.9kg, proche du poids adulte vers 200-250 jours
RACES = {
    "Californien": dict(poids_adulte=4.0, k=0.028, t_infl=50),
    "Néo-Zélandais": dict(poids_adulte=4.5, k=0.026, t_infl=52),
    "Chinchilla": dict(poids_adulte=3.8, k=0.030, t_infl=48),
    "Géant des Flandres": dict(poids_adulte=6.5, k=0.020, t_infl=65),
    "Local": dict(poids_adulte=3.0, k=0.032, t_infl=42),
}
SEXES = ["MALE", "FEMELLE"]


def poids_gompertz(age_jours: np.ndarray, poids_adulte: float, k: float, t_infl: float) -> np.ndarray:
    return poids_adulte * np.exp(-np.exp(-k * (age_jours - t_infl)))


def simuler_un_lapin(lapin_id: int) -> list[dict]:
    race = RNG.choice(list(RACES.keys()))
    sexe = RNG.choice(SEXES)
    base = RACES[race]

    # variation génétique individuelle autour des paramètres de la race
    poids_adulte = base["poids_adulte"] * RNG.normal(1.0, 0.08)
    # les femelles sont en moyenne légèrement plus lourdes à maturité (effet
    # modeste, cohérent avec la zootechnie cunicole usuelle)
    if sexe == "FEMELLE":
        poids_adulte *= 1.03
    k = base["k"] * RNG.normal(1.0, 0.06)
    t_infl = base["t_infl"] * RNG.normal(1.0, 0.06)

    date_naissance = date(2025, 1, 1) + timedelta(days=int(RNG.integers(0, 400)))

    lignes = []
    age = AGE_DEBUT_SUIVI_JOURS + int(RNG.integers(-4, 5))
    while age <= AGE_FIN_SUIVI_JOURS:
        poids_reel = poids_gompertz(np.array([age]), poids_adulte, k, t_infl)[0]
        poids_mesure = poids_reel * RNG.normal(1.0, BRUIT_MESURE_RELATIF)
        lignes.append(
            {
                "lapin_id": lapin_id,
                "race": race,
                "sexe": sexe,
                "date_naissance": date_naissance.isoformat(),
                "date_pesee": (date_naissance + timedelta(days=age)).isoformat(),
                "age_jours": age,
                "poids": round(max(poids_mesure, 0.05), 3),
            }
        )
        age += max(int(RNG.normal(ECART_PESEE_MOYEN_JOURS, 4)), 5)

    return lignes


def main() -> None:
    toutes_les_lignes: list[dict] = []
    for lapin_id in range(1, NOMBRE_LAPINS + 1):
        toutes_les_lignes.extend(simuler_un_lapin(lapin_id))

    df = pd.DataFrame(toutes_les_lignes)
    df.to_csv("data/pesees_synthetiques.csv", index=False)
    print(f"{len(df)} pesées générées pour {NOMBRE_LAPINS} lapins synthétiques")
    print(df.groupby("race")["poids"].agg(["count", "mean", "max"]).round(2))


if __name__ == "__main__":
    main()
