import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  Sexe,
  StatutAccouplement,
  StatutLapin,
} from '../../generated/prisma/enums';
import { CreateAccouplementDto } from './dto/create-accouplement.dto';
import { ValiderMalgreAlerteDto } from './dto/valider-malgre-alerte.dto';
import { FindAccouplementsQueryDto } from './dto/find-accouplements-query.dto';

// on remonte jusqu'aux grands-parents : suffisant pour couvrir tous les cas
// du tableau de décision (frère/sœur, parent/enfant, demi-frère/sœur, cousins) —
// au-delà, F devient négligeable ("lien lointain ou aucun")
const MAX_GENERATIONS = 2;

type NiveauAlerte = 'FORTE' | 'ALERTE' | 'MODEREE' | 'AUCUNE';

@Injectable()
export class AccouplementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(eleveurId: string, dto: CreateAccouplementDto) {
    await this.trouverEtValiderCouple(eleveurId, dto.maleId, dto.femelleId);

    const { coefficient: coefficientParente, typeParente } =
      await this.analyserParente(dto.maleId, dto.femelleId);

    const accouplement = await this.prisma.accouplement.create({
      data: {
        maleId: dto.maleId,
        femelleId: dto.femelleId,
        dateAccouplement: new Date(dto.dateAccouplement),
        coefficientParente,
        typeParente,
      },
    });

    return {
      ...accouplement,
      niveauAlerte: this.determinerNiveauAlerte(coefficientParente),
    };
  }

  // prévisualisation sans effet de bord : permet d'afficher l'alerte de
  // consanguinité dès que le mâle et la femelle sont choisis dans le
  // formulaire, avant même de soumettre la création — évite à l'éleveur de
  // créer l'accouplement pour découvrir l'alerte seulement après coup
  async verifierParente(eleveurId: string, maleId: string, femelleId: string) {
    await this.trouverEtValiderCouple(eleveurId, maleId, femelleId);

    const { coefficient, typeParente } = await this.analyserParente(
      maleId,
      femelleId,
    );

    return {
      coefficientParente: coefficient,
      typeParente,
      niveauAlerte: this.determinerNiveauAlerte(coefficient),
    };
  }

  private async trouverEtValiderCouple(
    eleveurId: string,
    maleId: string,
    femelleId: string,
  ) {
    if (maleId === femelleId) {
      throw new BadRequestException(
        'Le mâle et la femelle doivent être des lapins différents',
      );
    }

    const [male, femelle] = await Promise.all([
      this.prisma.lapin.findFirst({ where: { id: maleId, eleveurId } }),
      this.prisma.lapin.findFirst({ where: { id: femelleId, eleveurId } }),
    ]);

    if (!male || !femelle) {
      throw new NotFoundException('Lapin introuvable');
    }

    for (const lapin of [male, femelle]) {
      if (!lapin.identifie) {
        throw new ConflictException(
          `Le lapin ${lapin.codeIdentification} n'est pas encore identifié (race/sexe/date de naissance manquants)`,
        );
      }
    }

    if (male.sexe !== Sexe.MALE) {
      throw new BadRequestException(
        'maleId doit désigner un lapin de sexe MALE',
      );
    }

    if (femelle.sexe !== Sexe.FEMELLE) {
      throw new BadRequestException(
        'femelleId doit désigner un lapin de sexe FEMELLE',
      );
    }

    for (const lapin of [male, femelle]) {
      if (
        lapin.statut === StatutLapin.DECEDE ||
        lapin.statut === StatutLapin.VENDU
      ) {
        throw new ConflictException(
          `Le lapin ${lapin.codeIdentification} est décédé ou vendu`,
        );
      }
    }

    // seule la femelle est bloquée par un cycle en cours : un mâle reste
    // disponible pour d'autres accouplements même après validation
    if (
      femelle.statut === StatutLapin.EN_GESTATION ||
      femelle.statut === StatutLapin.ALLAITEMENT
    ) {
      throw new ConflictException(
        `La femelle ${femelle.codeIdentification} n'est pas disponible (en gestation ou en allaitement) — attends la confirmation du sevrage`,
      );
    }

    return { male, femelle };
  }

  async findAll(eleveurId: string, query: FindAccouplementsQueryDto) {
    const accouplements = await this.prisma.accouplement.findMany({
      where: {
        male: { eleveurId },
        statut: query.statut,
        ...(query.lapinId
          ? { OR: [{ maleId: query.lapinId }, { femelleId: query.lapinId }] }
          : {}),
      },
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
          },
        },
      },
      orderBy: { dateAccouplement: 'desc' },
    });

    return accouplements.map((a) => ({
      ...a,
      male: { ...a.male, race: a.male.race?.nom ?? null },
      femelle: { ...a.femelle, race: a.femelle.race?.nom ?? null },
      niveauAlerte: this.determinerNiveauAlerte(a.coefficientParente),
    }));
  }

  async findOne(eleveurId: string, id: string) {
    const accouplement = await this.trouverAvecOwnership(eleveurId, id);

    return {
      ...accouplement,
      niveauAlerte: this.determinerNiveauAlerte(
        accouplement.coefficientParente,
      ),
    };
  }

  async valider(eleveurId: string, id: string) {
    const accouplement = await this.trouverAvecOwnership(eleveurId, id);
    this.assertEnAttente(accouplement);

    const niveau = this.determinerNiveauAlerte(accouplement.coefficientParente);
    if (niveau !== 'AUCUNE') {
      throw new ConflictException(
        'Ce couple présente un risque de consanguinité : utilisez la validation forcée (avec motif) ou annulez',
      );
    }

    return this.confirmerAccouplement(accouplement, StatutAccouplement.VALIDE);
  }

  async validerMalgreAlerte(
    eleveurId: string,
    id: string,
    dto: ValiderMalgreAlerteDto,
  ) {
    const accouplement = await this.trouverAvecOwnership(eleveurId, id);
    this.assertEnAttente(accouplement);

    return this.confirmerAccouplement(
      accouplement,
      StatutAccouplement.VALIDE_MALGRE_ALERTE,
      dto.motif,
    );
  }

  async annuler(eleveurId: string, id: string) {
    const accouplement = await this.trouverAvecOwnership(eleveurId, id);
    this.assertEnAttente(accouplement);

    return this.prisma.accouplement.update({
      where: { id },
      data: { statut: StatutAccouplement.ANNULE },
    });
  }

  private async confirmerAccouplement(
    accouplement: { id: string; maleId: string; femelleId: string },
    statutCible: StatutAccouplement,
    motif?: string,
  ) {
    const [male, femelle] = await Promise.all([
      this.prisma.lapin.findUniqueOrThrow({
        where: { id: accouplement.maleId },
      }),
      this.prisma.lapin.findUniqueOrThrow({
        where: { id: accouplement.femelleId },
      }),
    ]);

    for (const lapin of [male, femelle]) {
      if (
        lapin.statut === StatutLapin.DECEDE ||
        lapin.statut === StatutLapin.VENDU
      ) {
        throw new ConflictException(
          `Le lapin ${lapin.codeIdentification} est décédé ou vendu depuis la proposition`,
        );
      }
    }

    // re-vérifié ici (pas seulement à la création) : du temps a pu s'écouler
    // entre la proposition et la validation de CET accouplement
    if (
      femelle.statut === StatutLapin.EN_GESTATION ||
      femelle.statut === StatutLapin.ALLAITEMENT
    ) {
      throw new ConflictException(
        `La femelle ${femelle.codeIdentification} n'est plus disponible (en gestation ou en allaitement depuis la proposition)`,
      );
    }

    const [accouplementMisAJour] = await this.prisma.$transaction([
      this.prisma.accouplement.update({
        where: { id: accouplement.id },
        data: { statut: statutCible, motifValidationForcee: motif },
      }),
      this.prisma.lapin.update({
        where: { id: accouplement.maleId },
        data: { statut: StatutLapin.REPRODUCTEUR },
      }),
      // la femelle entre en gestation, pas simplement "reproductrice" — elle
      // ne redeviendra disponible qu'au sevrage confirmé de la portée
      this.prisma.lapin.update({
        where: { id: accouplement.femelleId },
        data: { statut: StatutLapin.EN_GESTATION },
      }),
    ]);

    return accouplementMisAJour;
  }

  private async trouverAvecOwnership(eleveurId: string, id: string) {
    const accouplement = await this.prisma.accouplement.findFirst({
      where: { id, male: { eleveurId } },
    });

    if (!accouplement) {
      throw new NotFoundException('Accouplement introuvable');
    }

    return accouplement;
  }

  private assertEnAttente(accouplement: { statut: StatutAccouplement }) {
    if (accouplement.statut !== StatutAccouplement.EN_ATTENTE) {
      throw new ConflictException(
        'Cet accouplement a déjà été traité (validé ou annulé)',
      );
    }
  }

  private determinerNiveauAlerte(f: number): NiveauAlerte {
    if (f >= 0.25) return 'FORTE';
    if (f >= 0.125) return 'ALERTE';
    if (f >= 0.03) return 'MODEREE';
    return 'AUCUNE';
  }

  // calcule le coefficient de Wright ET dérive un libellé du lien de
  // parenté (frère/sœur, cousins...) à partir des MÊMES ancêtres communs —
  // le coefficient seul ne suffit pas à distinguer certains cas (un
  // demi-frère/sœur et un couple oncle/nièce donnent tous deux F=0,125),
  // d'où la nécessité de regarder directement les distances généalogiques
  // plutôt que de deviner depuis la valeur finale
  private async analyserParente(
    maleId: string,
    femelleId: string,
  ): Promise<{ coefficient: number; typeParente: string | null }> {
    const [ancetresMale, ancetresFemelle] = await Promise.all([
      this.getAncestorsMap(maleId, MAX_GENERATIONS),
      this.getAncestorsMap(femelleId, MAX_GENERATIONS),
    ]);

    let coefficient = 0;
    const ancetresCommuns: { n1: number; n2: number }[] = [];
    for (const [ancetreId, n1] of ancetresMale) {
      const n2 = ancetresFemelle.get(ancetreId);
      if (n2 !== undefined) {
        coefficient += Math.pow(0.5, n1 + n2 + 1);
        ancetresCommuns.push({ n1, n2 });
      }
    }

    return {
      coefficient,
      typeParente: this.libelleTypeParente(ancetresCommuns),
    };
  }

  private libelleTypeParente(
    ancetresCommuns: { n1: number; n2: number }[],
  ): string | null {
    if (ancetresCommuns.length === 0) return null;

    // l'un est un ancêtre direct de l'autre (distance 0 → 1)
    if (
      ancetresCommuns.some(
        (a) => (a.n1 === 0 && a.n2 === 1) || (a.n1 === 1 && a.n2 === 0),
      )
    ) {
      return 'Parent et enfant';
    }

    const parentsCommuns = ancetresCommuns.filter(
      (a) => a.n1 === 1 && a.n2 === 1,
    );
    if (parentsCommuns.length >= 2) return 'Frère et sœur (mêmes parents)';
    if (parentsCommuns.length === 1) {
      return 'Demi-frère et demi-sœur (un seul parent commun)';
    }

    if (
      ancetresCommuns.some(
        (a) => (a.n1 === 1 && a.n2 === 2) || (a.n1 === 2 && a.n2 === 1),
      )
    ) {
      return 'Oncle ou tante, et neveu ou nièce';
    }

    if (ancetresCommuns.some((a) => a.n1 === 2 && a.n2 === 2)) {
      return 'Cousins germains';
    }

    return 'Lien de parenté éloigné';
  }

  // inclut le lapin lui-même à distance 0, pour détecter aussi le cas
  // parent/enfant (pas seulement frère/sœur) quand on croise les deux maps
  private async getAncestorsMap(
    lapinId: string,
    maxGen: number,
  ): Promise<Map<string, number>> {
    const distances = new Map<string, number>([[lapinId, 0]]);
    let generationCourante = [lapinId];

    for (let gen = 1; gen <= maxGen && generationCourante.length > 0; gen++) {
      const lapins = await this.prisma.lapin.findMany({
        where: { id: { in: generationCourante } },
        select: { pereId: true, mereId: true },
      });

      const generationSuivante: string[] = [];
      for (const lapin of lapins) {
        for (const parentId of [lapin.pereId, lapin.mereId]) {
          if (!parentId) continue;
          if (!distances.has(parentId)) {
            distances.set(parentId, gen);
          }
          generationSuivante.push(parentId);
        }
      }
      generationCourante = generationSuivante;
    }

    return distances;
  }
}
