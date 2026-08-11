"""
Construction des caractéristiques (features) à partir de l'historique de
pesées d'un lapin — utilisé à l'identique par l'entraînement (train_model.py)
et par le service (app/main.py), pour garantir que le modèle voit les mêmes
colonnes en entraînement et en production.
"""

from datetime import date, datetime

# races couvertes par les données synthétiques d'entraînement (cf.
# data/generate_synthetic_data.py) — une race saisie par l'éleveur qui ne
# correspond à aucune de ces valeurs se traduit simplement par des colonnes
# one-hot à 0 (le modèle retombe sur un profil de croissance "moyen")
RACES_CONNUES = ["Californien", "Néo-Zélandais", "Chinchilla", "Géant des Flandres", "Local"]

COLONNES_FEATURES = [
    "age_actuel_jours",
    "age_cible_jours",
    "horizon_jours",
    "dernier_poids",
    "nombre_pesees",
    "taux_croissance",
    "sexe_male",
    *[f"race_{r}" for r in RACES_CONNUES],
]


def parser_date(valeur) -> date:
    if isinstance(valeur, datetime):
        return valeur.date()
    if isinstance(valeur, date):
        return valeur
    # les dates viennent du backend NestJS au format ISO 8601
    # (Date.toISOString(), ex. "2026-08-01T00:00:00.000Z")
    return datetime.fromisoformat(str(valeur).replace("Z", "+00:00")).date()


def construire_features(
    race: str,
    sexe: str,
    date_naissance,
    historique: list[dict],
    horizon_jours: int,
) -> dict:
    if len(historique) < 2:
        raise ValueError("Historique insuffisant (2 pesées minimum requises)")

    dn = parser_date(date_naissance)
    points = sorted(
        ((parser_date(p["date"]), float(p["poids"])) for p in historique),
        key=lambda point: point[0],
    )
    premiere_date, premier_poids = points[0]
    derniere_date, dernier_poids = points[-1]

    age_actuel = (derniere_date - dn).days
    duree_observation = max((derniere_date - premiere_date).days, 1)
    taux_croissance = (dernier_poids - premier_poids) / duree_observation

    valeurs = {
        "age_actuel_jours": float(age_actuel),
        "age_cible_jours": float(age_actuel + horizon_jours),
        "horizon_jours": float(horizon_jours),
        "dernier_poids": float(dernier_poids),
        "nombre_pesees": float(len(points)),
        "taux_croissance": float(taux_croissance),
        "sexe_male": 1.0 if sexe == "MALE" else 0.0,
    }
    for r in RACES_CONNUES:
        valeurs[f"race_{r}"] = 1.0 if race == r else 0.0

    return valeurs


def features_vers_vecteur(valeurs: dict) -> list[float]:
    return [valeurs[colonne] for colonne in COLONNES_FEATURES]
