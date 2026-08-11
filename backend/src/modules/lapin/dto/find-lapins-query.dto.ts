import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Sexe, StatutLapin } from '../../../generated/prisma/enums';

export class FindLapinsQueryDto {
  @IsOptional()
  @IsEnum(StatutLapin)
  statut?: StatutLapin;

  @IsOptional()
  @IsEnum(Sexe)
  sexe?: Sexe;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  origineExterieure?: boolean;
}
