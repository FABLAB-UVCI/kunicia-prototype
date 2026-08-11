import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateDistributionDto {
  @IsUUID()
  stockId!: string;

  @IsOptional()
  @IsUUID()
  cageId?: string;

  @IsPositive()
  quantiteParJour!: number;

  @IsInt()
  @Min(1)
  nombreLapins!: number;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;
}
