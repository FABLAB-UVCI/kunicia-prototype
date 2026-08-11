import { IsOptional, IsUUID } from 'class-validator';

export class FindPeseesQueryDto {
  @IsOptional()
  @IsUUID()
  lapinId?: string;
}
