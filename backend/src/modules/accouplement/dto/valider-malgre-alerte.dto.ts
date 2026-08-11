import { IsNotEmpty, IsString } from 'class-validator';

export class ValiderMalgreAlerteDto {
  @IsString()
  @IsNotEmpty()
  motif!: string;
}
