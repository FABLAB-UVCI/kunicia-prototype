import { IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class CreateLapinsLotDto {
  @IsInt()
  @IsPositive()
  nombre!: number;

  @IsOptional()
  @IsUUID()
  cageId?: string;
}
