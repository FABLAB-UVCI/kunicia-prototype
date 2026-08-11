import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateDepenseDto {
  @IsString()
  @IsNotEmpty()
  categorie!: string;

  @IsString()
  @IsNotEmpty()
  libelle!: string;

  @IsPositive()
  montant!: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}
