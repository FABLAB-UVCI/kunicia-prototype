import { IsOptional, IsUUID } from 'class-validator';

export class FindDistributionsQueryDto {
  @IsOptional()
  @IsUUID()
  stockId?: string;
}
