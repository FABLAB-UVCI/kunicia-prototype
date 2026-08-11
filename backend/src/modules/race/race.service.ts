import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';

@Injectable()
export class RaceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(eleveurId: string, dto: CreateRaceDto) {
    try {
      return await this.prisma.race.create({
        data: {
          nom: dto.nom,
          poidsAdulteMoyen: dto.poidsAdulteMoyen,
          paysOrigine: dto.paysOrigine,
          aptitude: dto.aptitude,
          caracteristiques: dto.caracteristiques ?? [],
          eleveurId,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Cette race existe déjà');
      }
      throw error;
    }
  }

  async findAll(eleveurId: string) {
    return this.prisma.race.findMany({
      where: { eleveurId },
      include: { _count: { select: { lapins: true } } },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(eleveurId: string, id: string) {
    const race = await this.prisma.race.findFirst({
      where: { id, eleveurId },
      include: { _count: { select: { lapins: true } } },
    });

    if (!race) {
      throw new NotFoundException('Race introuvable');
    }

    return race;
  }

  async update(eleveurId: string, id: string, dto: UpdateRaceDto) {
    await this.assertOwnership(eleveurId, id);

    try {
      return await this.prisma.race.update({ where: { id }, data: dto });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Cette race existe déjà');
      }
      throw error;
    }
  }

  async remove(eleveurId: string, id: string) {
    const race = await this.prisma.race.findFirst({
      where: { id, eleveurId },
      include: { _count: { select: { lapins: true } } },
    });

    if (!race) {
      throw new NotFoundException('Race introuvable');
    }

    if (race._count.lapins > 0) {
      throw new ConflictException(
        'Impossible de supprimer une race utilisée par des lapins',
      );
    }

    await this.prisma.race.delete({ where: { id } });
  }

  async assertOwnership(eleveurId: string, id: string) {
    const race = await this.prisma.race.findFirst({ where: { id, eleveurId } });
    if (!race) {
      throw new NotFoundException('Race introuvable');
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
