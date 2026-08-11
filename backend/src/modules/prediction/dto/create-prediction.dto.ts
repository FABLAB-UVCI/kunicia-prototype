import { IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class CreatePredictionDto {
  @IsUUID()
  lapinId!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  horizonJours?: number;
}
