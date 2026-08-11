import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TypeMouvement } from '../../../generated/prisma/enums';

export class FindMouvementsQueryDto {
  @IsOptional()
  @IsUUID()
  lapinId?: string;

  @IsOptional()
  @IsUUID()
  cageId?: string;

  @IsOptional()
  @IsEnum(TypeMouvement)
  typeMouvement?: TypeMouvement;
}
