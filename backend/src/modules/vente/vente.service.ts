import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StatutLapin, TypeMouvement } from '../../generated/prisma/enums';
import { CreateVenteDto } from './dto/create-vente.dto';
import { ClientService } from '../client/client.service';

const SELECT_LAPIN_RESUME = {
  select: {
    id: true,
    codeIdentification: true,
    nom: true,
    race: { select: { nom: true } },
  },
} as const;

@Injectable()
export class VenteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: ClientService,
  ) {}

  async create(eleveurId: string, dto: CreateVenteDto) {
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
      throw new ConflictException('Ce lapin est déjà décédé ou vendu');
    }

    if (!lapin.identifie) {
      throw new ConflictException(
        'Ce lapin doit être identifié (race, sexe, date de naissance) avant de pouvoir être vendu',
      );
    }

    if (dto.clientId) {
      await this.clientService.assertOwnership(eleveurId, dto.clientId);
    }

    const dateVente = dto.dateVente ? new Date(dto.dateVente) : new Date();

    const [vente] = await this.prisma.$transaction([
      this.prisma.vente.create({
        data: {
          lapinId: dto.lapinId,
          clientId: dto.clientId,
          prix: dto.prix,
          dateVente,
          eleveurId,
        },
        include: {
          lapin: SELECT_LAPIN_RESUME,
          client: { select: { id: true, nom: true } },
        },
      }),
      this.prisma.mouvementLapin.create({
        data: {
          lapinId: dto.lapinId,
          typeMouvement: TypeMouvement.VENTE,
          dateMouvement: dateVente,
        },
      }),
      this.prisma.lapin.update({
        where: { id: dto.lapinId },
        data: { statut: StatutLapin.VENDU, cageActuelleId: null },
      }),
    ]);

    const { race, ...lapinResume } = vente.lapin;
    return { ...vente, lapin: { ...lapinResume, race: race?.nom ?? null } };
  }

  async findAll(eleveurId: string) {
    const ventes = await this.prisma.vente.findMany({
      where: { eleveurId },
      include: {
        lapin: SELECT_LAPIN_RESUME,
        client: { select: { id: true, nom: true } },
      },
      orderBy: { dateVente: 'desc' },
    });

    return ventes.map(({ lapin, ...vente }) => ({
      ...vente,
      lapin: { ...lapin, race: lapin.race?.nom ?? null },
    }));
  }
}
