export interface StockAlimentation {
  id: string;
  typeAliment: string;
  quantiteInitiale: number;
  quantiteRestante: number;
  dateAchat: string;
  eleveurId: string;
}

export interface DistributionResume {
  dateEpuisementEstimee: string;
  consommationJournaliere: number;
}

export interface StockListItem extends StockAlimentation {
  distributionActuelle: DistributionResume | null;
}

export interface DistributionAlimentation {
  id: string;
  stockId: string;
  cageId: string | null;
  quantiteParJour: number;
  nombreLapins: number;
  dateDebut: string;
  consommationJournaliere: number;
  dateEpuisementEstimee: string;
}

export interface StockDetail extends StockAlimentation {
  distributions: DistributionAlimentation[];
  quantiteRestanteEstimee: number;
}

export interface CreateStockPayload {
  typeAliment: string;
  quantiteInitiale: number;
  dateAchat?: string;
}

export interface CreateDistributionPayload {
  stockId: string;
  cageId?: string;
  quantiteParJour: number;
  nombreLapins: number;
  dateDebut?: string;
}

export interface FindDistributionsQuery {
  stockId?: string;
}
