import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateDepenseDto } from './dto/create-depense.dto';

@Injectable()
export class DepenseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(eleveurId: string, dto: CreateDepenseDto) {
    return this.prisma.depense.create({
      data: {
        categorie: dto.categorie,
        libelle: dto.libelle,
        montant: dto.montant,
        date: dto.date ? new Date(dto.date) : undefined,
        eleveurId,
      },
    });
  }

  async findAll(eleveurId: string) {
    return this.prisma.depense.findMany({
      where: { eleveurId },
      orderBy: { date: 'desc' },
    });
  }

  async remove(eleveurId: string, id: string) {
    const depense = await this.prisma.depense.findFirst({
      where: { id, eleveurId },
    });

    if (!depense) {
      throw new NotFoundException('Dépense introuvable');
    }

    await this.prisma.depense.delete({ where: { id } });
  }
}
