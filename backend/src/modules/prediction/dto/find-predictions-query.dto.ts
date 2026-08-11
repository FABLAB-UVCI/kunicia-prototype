import { IsOptional, IsUUID } from 'class-validator';

export class FindPredictionsQueryDto {
  @IsOptional()
  @IsUUID()
  lapinId?: string;
}
