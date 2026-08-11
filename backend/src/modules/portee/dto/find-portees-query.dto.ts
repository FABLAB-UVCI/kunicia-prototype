import { IsOptional, IsUUID } from 'class-validator';

export class FindPorteesQueryDto {
  @IsOptional()
  @IsUUID()
  accouplementId?: string;
}
