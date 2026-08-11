import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePorteeDto {
  @IsUUID()
  accouplementId!: string;

  @IsDateString()
  dateNaissance!: string;

  @IsInt()
  @Min(1)
  nombreNes!: number;

  @IsOptional()
  @IsPositive()
  poidsMoyenNaissance?: number;
}
