export interface Prediction {
  id: string;
  lapinId: string;
  dateCalcul: string;
  poidsPredit: number;
  dateEcheance: string;
  poidsReel: number | null;
  ecartPourcentage: number | null;
  ecartAnormal: boolean;
}

export interface CreatePredictionPayload {
  lapinId: string;
  horizonJours?: number;
}

export interface ResultatPredictionCheptel {
  nombreCalculees: number;
  nombreIgnorees: number;
  nombreEchecs: number;
}

export interface FindPredictionsQuery {
  lapinId?: string;
}

export interface DashboardDetail {
  lapinId: string;
  codeIdentification: string;
  nom: string | null;
  poidsPredit: number | null;
  dateEcheance: string | null;
  ecartPourcentage: number | null;
  ecartAnormal: boolean;
}

export interface DashboardPredictions {
  poidsTotalEstime: number;
  nombreLapinsAvecPrediction: number;
  nombreLapinsSansPrediction: number;
  nombreEcartsAnormaux: number;
  details: DashboardDetail[];
}
