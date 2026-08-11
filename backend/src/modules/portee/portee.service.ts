import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { StatutAccouplement, StatutLapin } from '../../generated/prisma/enums';
import { CreatePorteeDto } from './dto/create-portee.dto';
import { ConfirmerSevrageDto } from './dto/confirmer-sevrage.dto';
import { FindPorteesQueryDto } from './dto/find-portees-query.dto';
import { RaceService } from '../race/race.service';

@Injectable()
export class PorteeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly raceService: RaceService,
  ) {}

  async create(eleveurId: string, dto: CreatePorteeDto) {
    const accouplement = await this.prisma.accouplement.findFirst({
      where: { id: dto.accouplementId, male: { eleveurId } },
    });

    if (!accouplement) {
      throw new NotFoundException('Accouplement introuvable');
    }

    if (
      accouplement.statut !== StatutAccouplement.VALIDE &&
      accouplement.statut !== StatutAccouplement.VALIDE_MALGRE_ALERTE
    ) {
      throw new ConflictException(
        "L'accouplement doit être validé avant d'enregistrer une portée",
      );
    }

    try {
      const [portee] = await this.prisma.$transaction([
        this.prisma.portee.create({
          data: {
            accouplementId: dto.accouplementId,
            dateNaissance: new Date(dto.dateNaissance),
            nombreNes: dto.nombreNes,
            poidsMoyenNaissance: dto.poidsMoyenNaissance,
          },
        }),
        // la mise bas fait passer la femelle de "en gestation" à
        // "allaitement" — elle reste indisponible pour un nouvel
        // accouplement jusqu'au sevrage confirmé
        this.prisma.lapin.update({
          where: { id: accouplement.femelleId },
          data: { statut: StatutLapin.ALLAITEMENT },
        }),
      ]);
      return portee;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Une portée existe déjà pour cet accouplement',
        );
      }
      throw error;
    }
  }

  async findAll(eleveurId: string, query: FindPorteesQueryDto) {
    const portees = await this.prisma.portee.findMany({
      where: {
        accouplement: { male: { eleveurId } },
        accouplementId: query.accouplementId,
      },
      include: { _count: { select: { lapins: true } } },
      orderBy: { dateNaissance: 'desc' },
    });

    return portees.map(({ _count, ...portee }) => ({
      ...portee,
      nombreSevres: _count.lapins,
    }));
  }

  async findOne(eleveurId: string, id: string) {
    await this.trouverAvecOwnership(eleveurId, id);

    const portee = await this.prisma.portee.findUniqueOrThrow({
      where: { id },
      include: {
        accouplement: {
          include: {
            male: {
              select: {
                id: true,
                codeIdentification: true,
                nom: true,
                race: { select: { nom: true } },
              },
            },
            femelle: {
              select: {
                id: true,
                codeIdentification: true,
                nom: true,
                race: { select: { nom: true } },
                // avant le sevrage, les petits n'ont pas de fiche
                // individuelle : ils vivent avec leur mère, donc la
                // localiser revient à localiser toute la portée
                cageActuelle: { select: { id: true, numero: true } },
              },
            },
          },
        },
        lapins: {
          select: {
            id: true,
            codeIdentification: true,
            nom: true,
            race: { select: { nom: true } },
            sexe: true,
            statut: true,
          },
        },
      },
    });

    return {
      ...portee,
      accouplement: {
        ...portee.accouplement,
        male: {
          ...portee.accouplement.male,
          race: portee.accouplement.male.race?.nom ?? null,
        },
        femelle: {
          ...portee.accouplement.femelle,
          race: portee.accouplement.femelle.race?.nom ?? null,
        },
      },
      lapins: portee.lapins.map(({ race, ...lapin }) => ({
        ...lapin,
        race: race?.nom ?? null,
      })),
    };
  }

  async confirmerSevrage(
    eleveurId: string,
    id: string,
    dto: ConfirmerSevrageDto,
  ) {
    const portee = await this.trouverAvecOwnership(eleveurId, id);

    if (portee.dateSevrage) {
      throw new ConflictException(
        'Le sevrage a déjà été confirmé pour cette portée',
      );
    }

    if (dto.lapins.length > portee.nombreNes) {
      throw new BadRequestException(
        'Le nombre de lapins sevrés ne peut pas dépasser le nombre de nés',
      );
    }

    const accouplement = await this.prisma.accouplement.findUniqueOrThrow({
      where: { id: portee.accouplementId },
    });

    const mere = await this.prisma.lapin.findUniqueOrThrow({
      where: { id: accouplement.femelleId },
    });

    const anneeCourte = portee.dateNaissance.getFullYear().toString().slice(-2);
    const prefixeCode = `${mere.codeIdentification}-${anneeCourte}-`;

    // une mère peut avoir plusieurs portées la même année — la numérotation
    // doit continuer après celles déjà attribuées, sinon la 2e portée de
    // l'année reproduit les mêmes codes que la 1re (violation de contrainte
    // unique sur codeIdentification)
    const nombreExistants = await this.prisma.lapin.count({
      where: {
        mereId: accouplement.femelleId,
        codeIdentification: { startsWith: prefixeCode },
      },
    });

    for (const lapinDto of dto.lapins) {
      await this.raceService.assertOwnership(eleveurId, lapinDto.raceId);
    }

    const lapinsACreer = dto.lapins.map((lapinDto, index) => {
      const numero = (nombreExistants + index + 1).toString().padStart(2, '0');
      return {
        codeIdentification: `${prefixeCode}${numero}`,
        nom: lapinDto.nom,
        raceId: lapinDto.raceId,
        sexe: lapinDto.sexe,
        dateNaissance: portee.dateNaissance,
        origineExterieure: false,
        eleveurId,
        pereId: accouplement.maleId,
        mereId: accouplement.femelleId,
        porteeId: portee.id,
      };
    });

    const [, lapinsCrees] = await this.prisma.$transaction([
      this.prisma.portee.update({
        where: { id: portee.id },
        data: { dateSevrage: new Date(dto.dateSevrage) },
      }),
      this.prisma.lapin.createManyAndReturn({ data: lapinsACreer }),
      // le sevrage confirmé libère la mère : elle redevient disponible pour
      // un nouvel accouplement
      this.prisma.lapin.update({
        where: { id: accouplement.femelleId },
        data: { statut: StatutLapin.REPRODUCTEUR },
      }),
    ]);

    return lapinsCrees;
  }

  private async trouverAvecOwnership(eleveurId: string, id: string) {
    const portee = await this.prisma.portee.findFirst({
      where: { id, accouplement: { male: { eleveurId } } },
    });

    if (!portee) {
      throw new NotFoundException('Portée introuvable');
    }

    return portee;
  }
}
