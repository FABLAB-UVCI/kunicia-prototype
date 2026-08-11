import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateRaceDto {
  @IsString()
  @IsNotEmpty()
  nom!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  poidsAdulteMoyen?: number;

  @IsOptional()
  @IsString()
  paysOrigine?: string;

  @IsOptional()
  @IsString()
  aptitude?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  caracteristiques?: string[];
}
