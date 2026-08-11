import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { StatutLapin } from '../../generated/prisma/enums';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { FindPredictionsQueryDto } from './dto/find-predictions-query.dto';

const HORIZON_JOURS_DEFAUT = 14;

// seuil fixe (non paramétrable par l'éleveur), même logique que les seuils
// de consanguinité — cf. cahier des charges §4.2 (détection d'écart anormal)
const SEUIL_ECART_ANORMAL = 0.15;

// en dessous de cet écart entre la première et la dernière pesée connues, le
// taux de croissance calculé (poids / jours) devient extrêmement instable :
// deux pesées le même jour donneraient par exemple 1 kg/jour, une valeur que
// le modèle n'a jamais vue à l'entraînement et qui produit une prédiction
// non fiable (cf. incident constaté : prédiction figée autour de 3,5 kg quel
// que soit l'horizon demandé, pour un historique à 0 jour d'écart)
const MIN_JOURS_TENDANCE_FIABLE = 3;

interface ReponseServiceIA {
  poidsPredit: number;
}

@Injectable()
export class PredictionService {
  private readonly pythonApiUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.pythonApiUrl =
      this.configService.get<string>('PYTHON_API_URL') ??
      'http://localhost:8000';
  }

  async create(eleveurId: string, dto: CreatePredictionDto) {
    const lapin = await this.prisma.lapin.findFirst({
      where: { id: dto.lapinId, eleveurId },
      include: { race: { select: { nom: true } } },
    });

    if (!lapin) {
      throw new NotFoundException('Lapin introuvable');
    }

    if (
      lapin.statut === StatutLapin.DECEDE ||
      lapin.statut === StatutLapin.VENDU
    ) {
      throw new BadRequestException(
        'Ce lapin est décédé ou vendu, prédiction impossible',
      );
    }

    if (!lapin.identifie || !lapin.race || !lapin.sexe || !lapin.dateNaissance) {
      throw new BadRequestException(
        "Ce lapin n'est pas encore identifié (race, sexe, date de naissance manquants), prédiction impossible",
      );
    }

    const historique = await this.prisma.pesee.findMany({
      where: { lapinId: dto.lapinId },
      orderBy: { date: 'asc' },
      select: { date: true, poids: true },
    });

    if (historique.length < 2) {
      throw new BadRequestException(
        'Historique de pesées insuffisant pour calculer une prédiction (2 pesées minimum)',
      );
    }

    if (!this.tendanceFiable(historique)) {
      throw new BadRequestException(
        `Les pesées disponibles sont trop rapprochées dans le temps pour calculer une tendance de croissance fiable (au moins ${MIN_JOURS_TENDANCE_FIABLE} jours d'écart entre la première et la dernière pesée)`,
      );
    }

    return this.calculerEtEnregistrer(
      {
        ...lapin,
        race: lapin.race.nom,
        sexe: lapin.sexe,
        dateNaissance: lapin.dateNaissance,
      },
      historique,
      dto.horizonJours ?? HORIZON_JOURS_DEFAUT,
    );
  }

  // lance le calcul pour tout le cheptel actif d'un coup, plutôt que lapin
  // par lapin — les lapins avec un historique insuffisant ou trop rapproché
  // dans le temps sont ignorés silencieusement (ce n'est pas une demande
  // explicite sur CE lapin), et un échec sur l'un n'empêche pas les autres
  // (Promise.allSettled)
  async creerPourCheptel(eleveurId: string) {
    const lapins = await this.prisma.lapin.findMany({
      where: {
        eleveurId,
        statut: { notIn: [StatutLapin.DECEDE, StatutLapin.VENDU] },
      },
      include: {
        race: { select: { nom: true } },
        pesees: {
          orderBy: { date: 'asc' },
          select: { date: true, poids: true },
        },
      },
    });

    const eligibles = lapins.filter(
      (lapin) =>
        lapin.identifie &&
        lapin.race &&
        lapin.sexe &&
        lapin.dateNaissance &&
        lapin.pesees.length >= 2 &&
        this.tendanceFiable(lapin.pesees),
    );
    const ignores = lapins.length - eligibles.length;

    const resultats = await Promise.allSettled(
      eligibles.map((lapin) =>
        this.calculerEtEnregistrer(
          {
            ...lapin,
            race: lapin.race!.nom,
            sexe: lapin.sexe!,
            dateNaissance: lapin.dateNaissance!,
          },
          lapin.pesees,
          HORIZON_JOURS_DEFAUT,
        ),
      ),
    );

    const calculees = resultats.filter((r) => r.status === 'fulfilled').length;
    const echecs = resultats.filter((r) => r.status === 'rejected').length;

    return {
      nombreCalculees: calculees,
      nombreIgnorees: ignores,
      nombreEchecs: echecs,
    };
  }

  private tendanceFiable(historique: { date: Date; poids: number }[]): boolean {
    const premiere = historique[0].date;
    const derniere = historique[historique.length - 1].date;
    const joursEcart =
      (derniere.getTime() - premiere.getTime()) / (1000 * 60 * 60 * 24);
    return joursEcart >= MIN_JOURS_TENDANCE_FIABLE;
  }

  private async calculerEtEnregistrer(
    lapin: { id: string; race: string; sexe: string; dateNaissance: Date },
    historique: { date: Date; poids: number }[],
    horizonJours: number,
  ) {
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + horizonJours);

    const { poidsPredit } = await this.appellerServiceIA({
      race: lapin.race,
      sexe: lapin.sexe,
      dateNaissance: lapin.dateNaissance.toISOString(),
      historique: historique.map((p) => ({
        date: p.date.toISOString(),
        poids: p.poids,
      })),
      horizonJours,
    });

    return this.prisma.prediction.create({
      data: {
        lapinId: lapin.id,
        poidsPredit,
        dateEcheance,
      },
    });
  }

  async findAll(eleveurId: string, query: FindPredictionsQueryDto) {
    const predictions = await this.prisma.prediction.findMany({
      where: { lapin: { eleveurId }, lapinId: query.lapinId },
      orderBy: { dateCalcul: 'desc' },
    });

    return predictions.map((prediction) => ({
      ...prediction,
      ...this.calculerEcart(prediction.poidsPredit, prediction.poidsReel),
    }));
  }

  async dashboard(eleveurId: string) {
    const lapins = await this.prisma.lapin.findMany({
      where: {
        eleveurId,
        statut: { notIn: [StatutLapin.DECEDE, StatutLapin.VENDU] },
      },
      select: {
        id: true,
        codeIdentification: true,
        nom: true,
        predictions: {
          orderBy: { dateCalcul: 'desc' },
          take: 1,
          select: { poidsPredit: true, dateEcheance: true, poidsReel: true },
        },
      },
    });

    const details = lapins.map((lapin) => {
      const derniere = lapin.predictions[0];
      return {
        lapinId: lapin.id,
        codeIdentification: lapin.codeIdentification,
        nom: lapin.nom,
        poidsPredit: derniere?.poidsPredit ?? null,
        dateEcheance: derniere?.dateEcheance ?? null,
        ...this.calculerEcart(
          derniere?.poidsPredit ?? null,
          derniere?.poidsReel ?? null,
        ),
      };
    });

    const poidsTotalEstime = details.reduce(
      (total, d) => total + (d.poidsPredit ?? 0),
      0,
    );

    return {
      poidsTotalEstime,
      nombreLapinsAvecPrediction: details.filter((d) => d.poidsPredit !== null)
        .length,
      nombreLapinsSansPrediction: details.filter((d) => d.poidsPredit === null)
        .length,
      nombreEcartsAnormaux: details.filter((d) => d.ecartAnormal).length,
      details,
    };
  }

  // écart entre poids prédit et poids réellement mesuré une fois la pesée
  // correspondante enregistrée (cf. pesee.service.ts, auto-remplissage de
  // poidsReel) — seuil fixe, même logique que les seuils de consanguinité
  private calculerEcart(
    poidsPredit: number | null,
    poidsReel: number | null,
  ): { ecartPourcentage: number | null; ecartAnormal: boolean } {
    if (poidsPredit === null || poidsReel === null) {
      return { ecartPourcentage: null, ecartAnormal: false };
    }

    const ecart = (poidsReel - poidsPredit) / poidsPredit;

    return {
      ecartPourcentage: Math.round(ecart * 1000) / 10,
      ecartAnormal: Math.abs(ecart) > SEUIL_ECART_ANORMAL,
    };
  }

  private async appellerServiceIA(payload: {
    race: string;
    sexe: string;
    dateNaissance: string;
    historique: { date: string; poids: number }[];
    horizonJours: number;
  }): Promise<ReponseServiceIA> {
    let response: Response;
    try {
      response = await fetch(`${this.pythonApiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Le service de prédiction IA (Python) est injoignable',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Le service de prédiction IA a renvoyé une erreur',
      );
    }

    return response.json() as Promise<ReponseServiceIA>;
  }
}
