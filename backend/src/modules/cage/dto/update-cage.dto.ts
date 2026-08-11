import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TypeCage } from '../../../generated/prisma/enums';

export class UpdateCageDto {
  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsEnum(TypeCage)
  type?: TypeCage;

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacite?: number;

  @IsOptional()
  @IsString()
  emplacement?: string;
}
