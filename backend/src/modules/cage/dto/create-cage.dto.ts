import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TypeCage } from '../../../generated/prisma/enums';

export class CreateCageDto {
  @IsString()
  @IsNotEmpty()
  numero!: string;

  @IsEnum(TypeCage)
  type!: TypeCage;

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacite?: number;

  @IsOptional()
  @IsString()
  emplacement?: string;
}
