import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateSanteDto {
  @IsUUID()
  lapinId!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  dateRappel?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
