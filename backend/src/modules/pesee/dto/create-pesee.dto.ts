import { IsDateString, IsOptional, IsUUID, Max, Min } from 'class-validator';

// plage large mais plausible pour un lapin (naissance ~0,03kg à un géant des
// Flandres adulte en surpoids) — sert surtout à intercepter une erreur de
// saisie évidente (ex. "80" au lieu de "0.8"), pas à contraindre l'élevage
const POIDS_MIN_KG = 0.02;
const POIDS_MAX_KG = 10;

export class CreatePeseeDto {
  @IsUUID()
  lapinId!: string;

  @Min(POIDS_MIN_KG, {
    message: `Le poids doit être d'au moins ${POIDS_MIN_KG} kg`,
  })
  @Max(POIDS_MAX_KG, {
    message: `Le poids ne peut pas dépasser ${POIDS_MAX_KG} kg`,
  })
  poids!: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}
