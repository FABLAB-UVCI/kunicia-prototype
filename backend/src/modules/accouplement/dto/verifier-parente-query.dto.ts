import { IsUUID } from 'class-validator';

export class VerifierParenteQueryDto {
  @IsUUID()
  maleId!: string;

  @IsUUID()
  femelleId!: string;
}
