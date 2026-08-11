import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StatutLapin, TypeMouvement } from '../../generated/prisma/enums';
import { CreateMouvementDto } from './dto/create-mouvement.dto';
import { FindMouvementsQueryDto } from './dto/find-mouvements-query.dto';

@Injectable()
export class MouvementLapinService {
  constructor(private readonly prisma: PrismaService) {}

  async create(eleveurId: string, dto: CreateMouvementDto) {
    const lapin = await this.prisma.lapin.findFirst({
      where: { id: dto.lapinId, eleveurId },
    });

    if (!lapin) {
      throw new NotFoundException('Lapin introuvable');
    }

    if (
      lapin.statut === StatutLapin.DECEDE ||
      lapin.statut === StatutLapin.VENDU
    ) {
      throw new ConflictException(
        'Ce lapin est décédé ou vendu, aucun mouvement supplémentaire possible',
      );
    }

    let cage: { id: string; capacite: number | null } | null = null;

    if (dto.typeMouvement === TypeMouvement.ENTREE_CAGE) {
      cage = await this.prisma.cage.findFirst({
        where: { id: dto.cageId, eleveurId },
        select: { id: true, capacite: true },
      });

      if (!cage) {
        throw new NotFoundException('Cage introuvable');
      }
    }

    const nouveauStatut = this.statutApresMouvement(
      dto.typeMouvement,
      lapin.statut,
    );
    const nouvelleCageActuelleId = this.cageActuelleApresMouvement(
      dto.typeMouvement,
      dto.cageId,
      lapin.cageActuelleId,
    );

    const [mouvement] = await this.prisma.$transaction([
      this.prisma.mouvementLapin.create({
        data: {
          lapinId: dto.lapinId,
          cageId:
            dto.typeMouvement === TypeMouvement.ENTREE_CAGE ? dto.cageId : null,
          typeMouvement: dto.typeMouvement,
          commentaire: dto.commentaire,
        },
      }),
      this.prisma.lapin.update({
        where: { id: dto.lapinId },
        data: {
          statut: nouveauStatut,
          cageActuelleId: nouvelleCageActuelleId,
        },
      }),
    ]);

    let alerteCapacite = false;
    if (cage) {
      const nombreOccupants = await this.prisma.lapin.count({
        where: { cageActuelleId: cage.id },
      });
      alerteCapacite = cage.capacite != null && nombreOccupants > cage.capacite;
    }

    return { ...mouvement, alerteCapacite };
  }

  async findAll(eleveurId: string, query: FindMouvementsQueryDto) {
    return this.prisma.mouvementLapin.findMany({
      where: {
        lapin: { eleveurId },
        lapinId: query.lapinId,
        cageId: query.cageId,
        typeMouvement: query.typeMouvement,
      },
      orderBy: { dateMouvement: 'desc' },
    });
  }

  private statutApresMouvement(
    type: TypeMouvement,
    statutActuel: StatutLapin,
  ): StatutLapin {
    if (type === TypeMouvement.DECES) return StatutLapin.DECEDE;
    if (type === TypeMouvement.VENTE) return StatutLapin.VENDU;
    return statutActuel;
  }

  private cageActuelleApresMouvement(
    type: TypeMouvement,
    cageId: string | undefined,
    cageActuelleActuelle: string | null,
  ): string | null {
    if (type === TypeMouvement.ENTREE_CAGE) return cageId ?? null;
    if (type === TypeMouvement.DECES || type === TypeMouvement.VENTE) {
      return null;
    }
    return cageActuelleActuelle; // CONTROLE : rien ne change
  }
}
