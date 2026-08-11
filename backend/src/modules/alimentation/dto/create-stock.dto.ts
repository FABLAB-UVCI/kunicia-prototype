import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  typeAliment!: string;

  @IsPositive()
  quantiteInitiale!: number;

  @IsOptional()
  @IsDateString()
  dateAchat?: string;
}
