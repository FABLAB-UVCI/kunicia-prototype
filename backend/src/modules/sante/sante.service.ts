import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateSanteDto } from './dto/create-sante.dto';
import { UpdateSanteDto } from './dto/update-sante.dto';

@Injectable()
export class SanteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(eleveurId: string, dto: CreateSanteDto) {
    const lapin = await this.prisma.lapin.findFirst({
      where: { id: dto.lapinId, eleveurId },
    });

    if (!lapin) {
      throw new NotFoundException('Lapin introuvable');
    }

    return this.prisma.sante.create({
      data: {
        lapinId: dto.lapinId,
        type: dto.type,
        date: dto.date ? new Date(dto.date) : undefined,
        dateRappel: dto.dateRappel ? new Date(dto.dateRappel) : undefined,
        notes: dto.notes,
      },
    });
  }

  async findAll(eleveurId: string, lapinId?: string) {
    return this.prisma.sante.findMany({
      where: { lapin: { eleveurId }, lapinId },
      orderBy: { date: 'desc' },
    });
  }

  async update(eleveurId: string, id: string, dto: UpdateSanteDto) {
    const suivi = await this.prisma.sante.findFirst({
      where: { id, lapin: { eleveurId } },
    });

    if (!suivi) {
      throw new NotFoundException('Suivi santé introuvable');
    }

    return this.prisma.sante.update({
      where: { id },
      data: {
        type: dto.type,
        date: dto.date ? new Date(dto.date) : undefined,
        dateRappel: dto.dateRappel ? new Date(dto.dateRappel) : undefined,
        notes: dto.notes,
      },
    });
  }
}
