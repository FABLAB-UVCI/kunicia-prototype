import { apiFetch } from "./client";
import {
  CreatePredictionPayload,
  DashboardPredictions,
  FindPredictionsQuery,
  Prediction,
  ResultatPredictionCheptel,
} from "../types/prediction";

function buildQuery(query: FindPredictionsQuery): string {
  const params = new URLSearchParams();
  if (query.lapinId) params.set("lapinId", query.lapinId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listerPredictions(query: FindPredictionsQuery = {}): Promise<Prediction[]> {
  return apiFetch<Prediction[]>(`/predictions${buildQuery(query)}`);
}

export function obtenirDashboardPredictions(): Promise<DashboardPredictions> {
  return apiFetch<DashboardPredictions>("/predictions/dashboard");
}

export function creerPrediction(payload: CreatePredictionPayload): Promise<Prediction> {
  return apiFetch<Prediction>("/predictions", { method: "POST", body: payload });
}

export function creerPredictionsPourCheptel(): Promise<ResultatPredictionCheptel> {
  return apiFetch<ResultatPredictionCheptel>("/predictions/cheptel", { method: "POST" });
}
