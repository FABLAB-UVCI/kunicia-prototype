import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StatutAccouplement } from '../../../generated/prisma/enums';

export class FindAccouplementsQueryDto {
  @IsOptional()
  @IsEnum(StatutAccouplement)
  statut?: StatutAccouplement;

  @IsOptional()
  @IsUUID()
  lapinId?: string;
}
