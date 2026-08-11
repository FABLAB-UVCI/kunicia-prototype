# Service de prédiction — Élevage cunicole

API Python / FastAPI qui expose un modèle scikit-learn de prédiction du
poids futur d'un lapin, à partir de son historique de pesées. Ne touche
jamais la base de données : reçoit du JSON, renvoie du JSON. Le backend
NestJS est le seul appelant (cf. cahier des charges, §7).

## Installation

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Générer les données et entraîner le modèle

Il n'existe pas encore de données réelles d'éleveurs à ce stade du projet —
les données d'entraînement sont donc synthétiques, générées à partir d'une
courbe de croissance de Gompertz par race (paramètres calibrés dans
`data/generate_synthetic_data.py`).

```bash
python3 data/generate_synthetic_data.py   # écrit data/pesees_synthetiques.csv
python3 train_model.py                    # entraîne, évalue, sauvegarde le modèle
```

`train_model.py` compare une régression linéaire à une forêt aléatoire et
garde le meilleur des deux (MAE sur un jeu de test). Le modèle retenu est
sauvegardé dans `model/modele_poids.joblib`.

## Lancer le service

```bash
uvicorn app.main:app --port 8000
```

Le backend NestJS pointe déjà vers `http://localhost:8000` par défaut
(`PYTHON_API_URL` dans `backend/.env`).

## Contrat de l'API

### `POST /predict`

```json
{
  "race": "Californien",
  "sexe": "MALE",
  "dateNaissance": "2026-05-01T00:00:00.000Z",
  "historique": [
    { "date": "2026-06-01T00:00:00.000Z", "poids": 0.7 },
    { "date": "2026-06-15T00:00:00.000Z", "poids": 1.3 }
  ],
  "horizonJours": 14
}
```

Réponse :

```json
{ "poidsPredit": 1.85 }
```

### `GET /health`

Vérifie que le modèle est bien chargé en mémoire.

## Réentraîner après avoir modifié les données ou les features

Si `data/generate_synthetic_data.py` ou `app/features.py` changent, il faut
relancer les deux commandes ci-dessus et redémarrer `uvicorn` pour charger
le nouveau modèle.
