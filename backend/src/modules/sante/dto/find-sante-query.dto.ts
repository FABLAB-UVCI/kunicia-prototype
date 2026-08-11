import { IsOptional, IsUUID } from 'class-validator';

export class FindSanteQueryDto {
  @IsOptional()
  @IsUUID()
  lapinId?: string;
}
