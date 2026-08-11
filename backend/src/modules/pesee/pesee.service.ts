import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StatutLapin } from '../../generated/prisma/enums';
import { CreatePeseeDto } from './dto/create-pesee.dto';

@Injectable()
export class PeseeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(eleveurId: string, dto: CreatePeseeDto) {
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
        'Ce lapin est décédé ou vendu, aucune pesée possible',
      );
    }

    const date = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const pesee = await tx.pesee.create({
        data: { lapinId: dto.lapinId, poids: dto.poids, date },
      });

      // auto-remplissage : complète la prédiction en attente la plus récente
      // dont l'échéance est passée — si le lapin est mort/vendu avant son
      // échéance, la prédiction reste simplement à poidsReel=null pour
      // toujours, naturellement exclue de tout calcul de fiabilité
      const predictionEnAttente = await tx.prediction.findFirst({
        where: {
          lapinId: dto.lapinId,
          poidsReel: null,
          dateEcheance: { lte: date },
        },
        orderBy: { dateEcheance: 'desc' },
      });

      if (predictionEnAttente) {
        await tx.prediction.update({
          where: { id: predictionEnAttente.id },
          data: { poidsReel: dto.poids },
        });
      }

      return pesee;
    });
  }

  async findAll(eleveurId: string, lapinId?: string) {
    return this.prisma.pesee.findMany({
      where: { lapin: { eleveurId }, lapinId },
      orderBy: { date: 'desc' },
    });
  }
}
