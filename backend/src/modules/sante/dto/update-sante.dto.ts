import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSanteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;

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
