import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Sexe } from '../../../generated/prisma/enums';

class LapinSevreDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @IsUUID()
  raceId!: string;

  @IsEnum(Sexe)
  sexe!: Sexe;
}

export class ConfirmerSevrageDto {
  @IsDateString()
  dateSevrage!: string;

  // un élément par lapin survivant au sevrage (peut être < nombreNes,
  // voire 0 en cas de perte totale de la portée) ; l'ordre du tableau
  // détermine le "N° dans la portée" utilisé dans le code d'identification
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LapinSevreDto)
  lapins!: LapinSevreDto[];
}
