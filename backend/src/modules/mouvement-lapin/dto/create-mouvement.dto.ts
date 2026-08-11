import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { TypeMouvement } from '../../../generated/prisma/enums';

export class CreateMouvementDto {
  @IsUUID()
  lapinId!: string;

  @IsEnum(TypeMouvement)
  typeMouvement!: TypeMouvement;

  // requis uniquement pour ENTREE_CAGE (ignoré pour DECES/VENTE/CONTROLE)
  @ValidateIf(
    (dto: CreateMouvementDto) =>
      dto.typeMouvement === TypeMouvement.ENTREE_CAGE,
  )
  @IsUUID()
  cageId?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}
