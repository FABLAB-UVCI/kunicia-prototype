# ============================================================
# ml-service — Kunicia (FastAPI prédiction de poids, port 8000)
# Données synthétiques + entraînement figés DANS l'image (au build) :
# démarrage instantané, aucun entraînement au runtime.
# ============================================================
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN python data/generate_synthetic_data.py && python train_model.py

ENV PORT=8000
EXPOSE 8000

# écoute sur $PORT (injecté par la plateforme) — health-check /health
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
