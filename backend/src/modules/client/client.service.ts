import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(eleveurId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        nom: dto.nom,
        telephone: dto.telephone,
        adresse: dto.adresse,
        eleveurId,
      },
    });
  }

  async findAll(eleveurId: string) {
    return this.prisma.client.findMany({
      where: { eleveurId },
      include: { _count: { select: { ventes: true } } },
      orderBy: { nom: 'asc' },
    });
  }

  async update(eleveurId: string, id: string, dto: UpdateClientDto) {
    await this.assertOwnership(eleveurId, id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(eleveurId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, eleveurId },
      include: { _count: { select: { ventes: true } } },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    if (client._count.ventes > 0) {
      throw new ConflictException(
        'Impossible de supprimer un client ayant des ventes enregistrées',
      );
    }

    await this.prisma.client.delete({ where: { id } });
  }

  async assertOwnership(eleveurId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, eleveurId },
    });
    if (!client) {
      throw new NotFoundException('Client introuvable');
    }
  }
}
