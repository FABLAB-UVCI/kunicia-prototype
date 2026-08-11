import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { CreateDistributionDto } from './dto/create-distribution.dto';

const MS_PAR_JOUR = 1000 * 60 * 60 * 24;

interface DistributionRate {
  dateDebut: Date;
  consommationJournaliere: number;
}

@Injectable()
export class AlimentationService {
  constructor(private readonly prisma: PrismaService) {}

  async createStock(eleveurId: string, dto: CreateStockDto) {
    return this.prisma.stockAlimentation.create({
      data: {
        typeAliment: dto.typeAliment,
        quantiteInitiale: dto.quantiteInitiale,
        quantiteRestante: dto.quantiteInitiale,
        dateAchat: dto.dateAchat ? new Date(dto.dateAchat) : undefined,
        eleveurId,
      },
    });
  }

  async findAllStocks(eleveurId: string) {
    const stocks = await this.prisma.stockAlimentation.findMany({
      where: { eleveurId },
      include: {
        distributions: {
          orderBy: { dateDebut: 'desc' },
          take: 1,
          select: {
            dateEpuisementEstimee: true,
            consommationJournaliere: true,
          },
        },
      },
      orderBy: { dateAchat: 'desc' },
    });

    return stocks.map(({ distributions, ...stock }) => ({
      ...stock,
      distributionActuelle: distributions[0] ?? null,
    }));
  }

  async findOneStock(eleveurId: string, id: string) {
    const stock = await this.prisma.stockAlimentation.findFirst({
      where: { id, eleveurId },
      include: { distributions: { orderBy: { dateDebut: 'desc' } } },
    });

    if (!stock) {
      throw new NotFoundException('Stock introuvable');
    }

    const derniereDistribution = stock.distributions[0];
    const quantiteRestanteEstimee = derniereDistribution
      ? this.estimerQuantiteRestante(
          stock.quantiteRestante,
          derniereDistribution,
        )
      : stock.quantiteRestante;

    return { ...stock, quantiteRestanteEstimee };
  }

  async createDistribution(eleveurId: string, dto: CreateDistributionDto) {
    const stock = await this.prisma.stockAlimentation.findFirst({
      where: { id: dto.stockId, eleveurId },
    });

    if (!stock) {
      throw new NotFoundException('Stock introuvable');
    }

    if (dto.cageId) {
      const cage = await this.prisma.cage.findFirst({
        where: { id: dto.cageId, eleveurId },
      });
      if (!cage) {
        throw new NotFoundException('Cage introuvable');
      }
    }

    // le dernier événement de distribution pour CE stock détermine le rythme
    // de consommation en vigueur jusqu'ici ; la nouvelle distribution
    // remplace ce rythme à partir de dateDebut (voir note dans la réponse)
    const derniereDistribution =
      await this.prisma.distributionAlimentation.findFirst({
        where: { stockId: dto.stockId },
        orderBy: { dateDebut: 'desc' },
      });

    const dateDebut = dto.dateDebut ? new Date(dto.dateDebut) : new Date();
    const consommationJournaliere = dto.quantiteParJour * dto.nombreLapins;

    const quantiteRestante = derniereDistribution
      ? this.estimerQuantiteRestante(
          stock.quantiteRestante,
          derniereDistribution,
          dateDebut,
        )
      : stock.quantiteRestante;

    const joursRestants = quantiteRestante / consommationJournaliere;
    const dateEpuisementEstimee = new Date(
      dateDebut.getTime() + joursRestants * MS_PAR_JOUR,
    );

    const [, distribution] = await this.prisma.$transaction([
      this.prisma.stockAlimentation.update({
        where: { id: stock.id },
        data: { quantiteRestante },
      }),
      this.prisma.distributionAlimentation.create({
        data: {
          stockId: dto.stockId,
          cageId: dto.cageId,
          quantiteParJour: dto.quantiteParJour,
          nombreLapins: dto.nombreLapins,
          dateDebut,
          consommationJournaliere,
          dateEpuisementEstimee,
        },
      }),
    ]);

    return distribution;
  }

  async findAllDistributions(eleveurId: string, stockId?: string) {
    return this.prisma.distributionAlimentation.findMany({
      where: { stock: { eleveurId }, stockId },
      orderBy: { dateDebut: 'desc' },
    });
  }

  private estimerQuantiteRestante(
    quantiteRestante: number,
    distribution: DistributionRate,
    aInstant: Date = new Date(),
  ): number {
    const joursEcoules = Math.max(
      (aInstant.getTime() - distribution.dateDebut.getTime()) / MS_PAR_JOUR,
      0,
    );
    const consomme = joursEcoules * distribution.consommationJournaliere;
    return Math.max(quantiteRestante - consomme, 0);
  }
}
