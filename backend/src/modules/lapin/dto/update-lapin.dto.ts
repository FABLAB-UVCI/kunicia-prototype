import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLapinDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @IsOptional()
  @IsUUID()
  raceId?: string;
}
