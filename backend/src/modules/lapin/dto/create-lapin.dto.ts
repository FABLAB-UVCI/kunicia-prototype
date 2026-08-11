import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Sexe } from '../../../generated/prisma/enums';

export class CreateLapinDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @IsUUID()
  raceId!: string;

  @IsEnum(Sexe)
  sexe!: Sexe;

  @IsDateString()
  dateNaissance!: string;
}
