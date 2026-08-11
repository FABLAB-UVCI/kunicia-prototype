import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateCageDto } from './dto/create-cage.dto';
import { UpdateCageDto } from './dto/update-cage.dto';

type StatutCage = 'VIDE' | 'OCCUPEE' | 'PLEINE' | 'ALERTE_CAPACITE';

interface CageAvecCompte {
  id: string;
  numero: string;
  type: string;
  qrCode: string;
  capacite: number | null;
  emplacement: string | null;
  createdAt: Date;
  _count: { lapinsActuels: number };
}

@Injectable()
export class CageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(eleveurId: string, dto: CreateCageDto) {
    // le QR code encode l'identifiant de la cage : on génère l'id nous-mêmes
    // pour pouvoir l'utiliser aussi comme valeur du QR dès la création
    const id = randomUUID();

    try {
      return await this.prisma.cage.create({
        data: {
          id,
          qrCode: id,
          numero: dto.numero,
          type: dto.type,
          capacite: dto.capacite,
          emplacement: dto.emplacement,
          eleveurId,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Ce numéro de cage est déjà utilisé');
      }
      throw error;
    }
  }

  async findAll(eleveurId: string) {
    const cages = await this.prisma.cage.findMany({
      where: { eleveurId },
      include: { _count: { select: { lapinsActuels: true } } },
      orderBy: { numero: 'asc' },
    });

    return cages.map((cage) => this.toSummary(cage));
  }

  async findOne(eleveurId: string, id: string) {
    const cage = await this.prisma.cage.findFirst({
      where: { id, eleveurId },
      include: {
        _count: { select: { lapinsActuels: true } },
        lapinsActuels: {
          select: {
            id: true,
            codeIdentification: true,
            nom: true,
            race: { select: { nom: true } },
            sexe: true,
            statut: true,
            dateNaissance: true,
          },
        },
      },
    });

    if (!cage) {
      throw new NotFoundException('Cage introuvable');
    }

    return {
      ...this.toSummary(cage),
      occupants: cage.lapinsActuels.map(({ race, ...lapin }) => ({
        ...lapin,
        race: race?.nom ?? null,
      })),
    };
  }

  async update(eleveurId: string, id: string, dto: UpdateCageDto) {
    await this.assertOwnership(eleveurId, id);

    try {
      return await this.prisma.cage.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Ce numéro de cage est déjà utilisé');
      }
      throw error;
    }
  }

  async remove(eleveurId: string, id: string) {
    const cage = await this.prisma.cage.findFirst({
      where: { id, eleveurId },
      include: { _count: { select: { lapinsActuels: true } } },
    });

    if (!cage) {
      throw new NotFoundException('Cage introuvable');
    }

    if (cage._count.lapinsActuels > 0) {
      throw new ConflictException('Impossible de supprimer une cage occupée');
    }

    await this.prisma.cage.delete({ where: { id } });
  }

  async assertOwnership(eleveurId: string, id: string) {
    const cage = await this.prisma.cage.findFirst({ where: { id, eleveurId } });
    if (!cage) {
      throw new NotFoundException('Cage introuvable');
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private toSummary(cage: CageAvecCompte) {
    const nombreOccupants = cage._count.lapinsActuels;

    return {
      id: cage.id,
      numero: cage.numero,
      type: cage.type,
      qrCode: cage.qrCode,
      capacite: cage.capacite,
      emplacement: cage.emplacement,
      createdAt: cage.createdAt,
      nombreOccupants,
      statut: this.computeStatut(nombreOccupants, cage.capacite),
    };
  }

  private computeStatut(
    occupantsCount: number,
    capacite: number | null,
  ): StatutCage {
    if (occupantsCount === 0) return 'VIDE';
    if (capacite == null) return 'OCCUPEE';
    if (occupantsCount > capacite) return 'ALERTE_CAPACITE';
    if (occupantsCount === capacite) return 'PLEINE';
    return 'OCCUPEE';
  }
}
