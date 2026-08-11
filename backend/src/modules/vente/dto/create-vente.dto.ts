import {
  IsDateString,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class CreateVenteDto {
  @IsUUID()
  lapinId!: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsPositive()
  prix!: number;

  @IsOptional()
  @IsDateString()
  dateVente?: string;
}
