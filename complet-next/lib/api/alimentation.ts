import { apiFetch } from "./client";
import {
  CreateDistributionPayload,
  CreateStockPayload,
  DistributionAlimentation,
  FindDistributionsQuery,
  StockAlimentation,
  StockDetail,
  StockListItem,
} from "../types/alimentation";

export function listerStocks(): Promise<StockListItem[]> {
  return apiFetch<StockListItem[]>("/stocks");
}

export function obtenirStock(id: string): Promise<StockDetail> {
  return apiFetch<StockDetail>(`/stocks/${id}`);
}

export function creerStock(payload: CreateStockPayload): Promise<StockAlimentation> {
  return apiFetch<StockAlimentation>("/stocks", { method: "POST", body: payload });
}

function buildQueryDistributions(query: FindDistributionsQuery): string {
  const params = new URLSearchParams();
  if (query.stockId) params.set("stockId", query.stockId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listerDistributions(
  query: FindDistributionsQuery = {},
): Promise<DistributionAlimentation[]> {
  return apiFetch<DistributionAlimentation[]>(
    `/distributions${buildQueryDistributions(query)}`,
  );
}

export function creerDistribution(
  payload: CreateDistributionPayload,
): Promise<DistributionAlimentation> {
  return apiFetch<DistributionAlimentation>("/distributions", {
    method: "POST",
    body: payload,
  });
}
