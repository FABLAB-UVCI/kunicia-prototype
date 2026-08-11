import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Sexe, StatutLapin, TypeMouvement } from '../../generated/prisma/enums';
import { CreateLapinDto } from './dto/create-lapin.dto';
import { UpdateLapinDto } from './dto/update-lapin.dto';
import { CreateLapinsLotDto } from './dto/create-lapins-lot.dto';
import { IdentifierLapinDto } from './dto/identifier-lapin.dto';
import { RaceService } from '../race/race.service';
import { CageService } from '../cage/cage.service';
import type { LapinModel } from '../../generated/prisma/models/Lapin';

const SELECT_RACE_NOM = { select: { nom: true } } as const;

function aplatirRace<T extends { race: { nom: string } | null }>(
  entite: T,
): Omit<T, 'race'> & { race: string | null } {
  const { race, ...reste } = entite;
  return { ...reste, race: race?.nom ?? null };
}

@Injectable()
export class LapinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly raceService: RaceService,
    private readonly cageService: CageService,
  ) {}

  async createOrigineExterieure(eleveurId: string, dto: CreateLapinDto) {
    await this.raceService.assertOwnership(eleveurId, dto.raceId);
    const codeIdentification = await this.genererCodeExterieur();

    const lapin = await this.prisma.lapin.create({
      data: {
        codeIdentification,
        nom: dto.nom,
        raceId: dto.raceId,
        sexe: dto.sexe,
        dateNaissance: new Date(dto.dateNaissance),
        origineExterieure: true,
        eleveurId,
      },
      include: { race: SELECT_RACE_NOM },
    });

    return aplatirRace(lapin);
  }

  async findAll(
    eleveurId: string,
    statut?: StatutLapin,
    sexe?: Sexe,
    origineExterieure?: boolean,
  ) {
    const lapins = await this.prisma.lapin.findMany({
      where: { eleveurId, statut, sexe, origineExterieure },
      include: { race: SELECT_RACE_NOM },
      orderBy: { createdAt: 'desc' },
    });

    return lapins.map(aplatirRace);
  }

  async findOne(eleveurId: string, id: string) {
    const lapin = await this.prisma.lapin.findFirst({
      where: { id, eleveurId },
      include: {
        race: SELECT_RACE_NOM,
        pere: {
          select: {
            id: true,
            codeIdentification: true,
            nom: true,
            race: SELECT_RACE_NOM,
          },
        },
        mere: {
          select: {
            id: true,
            codeIdentification: true,
            nom: true,
            race: SELECT_RACE_NOM,
          },
        },
        cageActuelle: { select: { id: true, numero: true } },
        portee: { select: { id: true, dateNaissance: true } },
        _count: {
          select: {
            pesees: true,
            enfantsPaternite: true,
            enfantsMaternite: true,
          },
        },
      },
    });

    if (!lapin) {
      throw new NotFoundException('Lapin introuvable');
    }

    // pour une femelle : date du dernier sevrage confirmé parmi ses portées
    // (utile pour savoir depuis quand elle est de nouveau disponible pour un
    // accouplement) — sans objet pour un mâle, qui n'a jamais de portée en
    // tant que femelle
    const dernierePortee = await this.prisma.portee.findFirst({
      where: { accouplement: { femelleId: id }, dateSevrage: { not: null } },
      orderBy: { dateSevrage: 'desc' },
      select: { dateSevrage: true },
    });

    return {
      ...aplatirRace(lapin),
      pere: lapin.pere ? aplatirRace(lapin.pere) : null,
      mere: lapin.mere ? aplatirRace(lapin.mere) : null,
      dernierSevrage: dernierePortee?.dateSevrage ?? null,
    };
  }

  async update(eleveurId: string, id: string, dto: UpdateLapinDto) {
    await this.assertOwnership(eleveurId, id);
    if (dto.raceId) {
      await this.raceService.assertOwnership(eleveurId, dto.raceId);
    }
    const lapin = await this.prisma.lapin.update({
      where: { id },
      data: dto,
      include: { race: SELECT_RACE_NOM },
    });
    return aplatirRace(lapin);
  }

  // création en lot pour un achat groupé : l'éleveur n'a souvent pas le
  // temps d'identifier (marquer les oreilles) chaque lapin tout de suite —
  // on réserve juste une plage d'identifiants, à compléter plus tard via
  // identifier() une fois les oreilles marquées
  async createLot(eleveurId: string, dto: CreateLapinsLotDto) {
    if (dto.cageId) {
      await this.cageService.assertOwnership(eleveurId, dto.cageId);
    }

    const codes = await this.genererCodesExterieur(dto.nombre);

    return this.prisma.$transaction(async (tx) => {
      const lapins: LapinModel[] = [];
      for (const codeIdentification of codes) {
        const lapin = await tx.lapin.create({
          data: {
            codeIdentification,
            origineExterieure: true,
            identifie: false,
            eleveurId,
            cageActuelleId: dto.cageId,
          },
        });
        lapins.push(lapin);

        if (dto.cageId) {
          await tx.mouvementLapin.create({
            data: {
              lapinId: lapin.id,
              cageId: dto.cageId,
              typeMouvement: TypeMouvement.ENTREE_CAGE,
            },
          });
        }
      }
      return lapins;
    });
  }

  // complète la fiche d'un lapin créé en lot, une fois ses oreilles
  // marquées — irréversible dans l'autre sens (pas de "dé-identification")
  async identifier(eleveurId: string, id: string, dto: IdentifierLapinDto) {
    const lapin = await this.prisma.lapin.findFirst({
      where: { id, eleveurId },
    });

    if (!lapin) {
      throw new NotFoundException('Lapin introuvable');
    }

    if (lapin.identifie) {
      throw new ConflictException('Ce lapin est déjà identifié');
    }

    await this.raceService.assertOwnership(eleveurId, dto.raceId);

    const misAJour = await this.prisma.lapin.update({
      where: { id },
      data: {
        nom: dto.nom,
        raceId: dto.raceId,
        sexe: dto.sexe,
        dateNaissance: new Date(dto.dateNaissance),
        identifie: true,
      },
      include: { race: SELECT_RACE_NOM },
    });

    return aplatirRace(misAJour);
  }

  async uploaderPhoto(eleveurId: string, id: string, nomFichier: string) {
    await this.assertOwnership(eleveurId, id);
    const lapin = await this.prisma.lapin.update({
      where: { id },
      data: { photoUrl: `/uploads/lapins/${nomFichier}` },
      include: { race: SELECT_RACE_NOM },
    });
    return aplatirRace(lapin);
  }

  private async assertOwnership(eleveurId: string, id: string) {
    const lapin = await this.prisma.lapin.findFirst({
      where: { id, eleveurId },
    });
    if (!lapin) {
      throw new NotFoundException('Lapin introuvable');
    }
  }

  private async genererCodeExterieur(): Promise<string> {
    const [code] = await this.genererCodesExterieur(1);
    return code;
  }

  private async genererCodesExterieur(nombre: number): Promise<string[]> {
    const anneeCourte = new Date().getFullYear().toString().slice(-2);
    // simplification acceptée : compteur basé sur un COUNT, pas une séquence
    // atomique — risque de collision négligeable en usage réel (saisie manuelle,
    // un seul éleveur à la fois), retenté proprement si le module accouplement
    // /portée introduit un jour de la création en masse concurrente
    const nombreExistants = await this.prisma.lapin.count({
      where: { codeIdentification: { startsWith: 'EXT-' } },
    });
    return Array.from({ length: nombre }, (_, i) => {
      const compteur = (nombreExistants + i + 1).toString().padStart(3, '0');
      return `EXT-${anneeCourte}-${compteur}`;
    });
  }
}
