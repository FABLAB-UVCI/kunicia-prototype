"""
Entraîne et évalue le modèle de prédiction de poids (cf. cahier des charges
§13, semaines 2-4 : scikit-learn — régression linéaire vs Random Forest,
évaluation, sauvegarde via joblib).

Construit les exemples d'entraînement à partir des séries de pesées
synthétiques : pour chaque lapin, on simule ce que l'éleveur verrait à un
instant donné (un historique tronqué) et on prend un poids futur de la même
série comme cible — exactement le scénario reproduit en production par
POST /predict.
"""

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import train_test_split

from app.features import COLONNES_FEATURES, construire_features

RNG = np.random.default_rng(7)
TIRAGES_PAR_LAPIN = 6  # nb d'exemples (historique, horizon) simulés par lapin


def construire_exemples(df: pd.DataFrame) -> pd.DataFrame:
    lignes = []
    for lapin_id, groupe in df.groupby("lapin_id"):
        groupe = groupe.sort_values("age_jours").reset_index(drop=True)
        n = len(groupe)
        if n < 3:
            continue

        race = groupe.loc[0, "race"]
        sexe = groupe.loc[0, "sexe"]
        date_naissance = groupe.loc[0, "date_naissance"]

        for _ in range(TIRAGES_PAR_LAPIN):
            # au moins 2 pesées connues, au moins 1 pesée future à prédire
            coupure = RNG.integers(2, n - 1)
            cible_idx = RNG.integers(coupure, n)
            if cible_idx == coupure - 1:
                continue

            historique = [
                {"date": groupe.loc[i, "date_pesee"], "poids": groupe.loc[i, "poids"]}
                for i in range(coupure)
            ]
            age_cutoff = groupe.loc[coupure - 1, "age_jours"]
            age_cible = groupe.loc[cible_idx, "age_jours"]
            horizon_jours = int(age_cible - age_cutoff)
            if horizon_jours <= 0:
                continue

            try:
                features = construire_features(
                    race, sexe, date_naissance, historique, horizon_jours
                )
            except ValueError:
                continue

            features["poids_cible"] = groupe.loc[cible_idx, "poids"]
            lignes.append(features)

    return pd.DataFrame(lignes)


def evaluer(nom: str, modele, X_test, y_test) -> float:
    predictions = modele.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    rmse = root_mean_squared_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    print(f"{nom:20s}  MAE={mae:.3f} kg   RMSE={rmse:.3f} kg   R²={r2:.3f}")
    return mae


def main() -> None:
    df = pd.read_csv("data/pesees_synthetiques.csv")
    exemples = construire_exemples(df)
    print(f"{len(exemples)} exemples d'entraînement construits")

    X = exemples[COLONNES_FEATURES]
    y = exemples["poids_cible"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=7)

    modeles = {
        "LinearRegression": LinearRegression(),
        "RandomForest": RandomForestRegressor(
            n_estimators=200, max_depth=10, random_state=7, n_jobs=-1
        ),
    }

    meilleur_nom, meilleur_modele, meilleure_mae = None, None, float("inf")
    for nom, modele in modeles.items():
        modele.fit(X_train, y_train)
        mae = evaluer(nom, modele, X_test, y_test)
        if mae < meilleure_mae:
            meilleur_nom, meilleur_modele, meilleure_mae = nom, modele, mae

    print(f"\nModèle retenu : {meilleur_nom} (MAE={meilleure_mae:.3f} kg)")

    joblib.dump(
        {"modele": meilleur_modele, "colonnes": COLONNES_FEATURES, "nom_modele": meilleur_nom},
        "model/modele_poids.joblib",
    )
    print("Modèle sauvegardé dans model/modele_poids.joblib")


if __name__ == "__main__":
    main()
