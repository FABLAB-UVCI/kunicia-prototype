"""
API de prédiction de poids — reçoit l'historique de pesées d'un lapin en
JSON, renvoie une prédiction de poids futur. Ne touche jamais la base de
données (cf. cahier des charges §7) : c'est le backend NestJS qui appelle ce
service, jamais l'inverse.
"""

from contextlib import asynccontextmanager
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.features import construire_features

CHEMIN_MODELE = Path(__file__).resolve().parent.parent / "model" / "modele_poids.joblib"
_etat_modele: dict = {}


@asynccontextmanager
async def cycle_de_vie(_app: FastAPI):
    if not CHEMIN_MODELE.exists():
        raise RuntimeError(
            f"Modèle introuvable à {CHEMIN_MODELE} — lancer `python train_model.py` d'abord"
        )
    _etat_modele.update(joblib.load(CHEMIN_MODELE))
    yield
    _etat_modele.clear()


app = FastAPI(title="Service de prédiction de croissance cunicole", lifespan=cycle_de_vie)


class PeseeEntree(BaseModel):
    date: str
    poids: float


class RequetePrediction(BaseModel):
    race: str
    sexe: str
    dateNaissance: str
    historique: list[PeseeEntree]
    horizonJours: int = Field(gt=0)


class ReponsePrediction(BaseModel):
    poidsPredit: float


@app.get("/health")
def health() -> dict:
    return {"ok": True, "modeleCharge": bool(_etat_modele)}


@app.post("/predict", response_model=ReponsePrediction)
def predict(requete: RequetePrediction) -> ReponsePrediction:
    if len(requete.historique) < 2:
        raise HTTPException(
            status_code=422,
            detail="Historique de pesées insuffisant (2 pesées minimum)",
        )

    try:
        features = construire_features(
            race=requete.race,
            sexe=requete.sexe,
            date_naissance=requete.dateNaissance,
            historique=[p.model_dump() for p in requete.historique],
            horizon_jours=requete.horizonJours,
        )
    except ValueError as erreur:
        raise HTTPException(status_code=422, detail=str(erreur)) from erreur

    colonnes = _etat_modele["colonnes"]
    X = pd.DataFrame([[features[c] for c in colonnes]], columns=colonnes)
    poids_predit = float(_etat_modele["modele"].predict(X)[0])

    # une prédiction ne peut pas être négative ou aberrante en dessous du
    # dernier poids mesuré si l'horizon est très court ; on borne par
    # sécurité sans pour autant masquer une vraie perte de poids détectée
    poids_predit = max(poids_predit, 0.05)

    return ReponsePrediction(poidsPredit=round(poids_predit, 3))
