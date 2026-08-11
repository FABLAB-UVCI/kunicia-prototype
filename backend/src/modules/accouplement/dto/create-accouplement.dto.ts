import { IsDateString, IsUUID } from 'class-validator';

export class CreateAccouplementDto {
  @IsUUID()
  maleId!: string;

  @IsUUID()
  femelleId!: string;

  @IsDateString()
  dateAccouplement!: string;
}
