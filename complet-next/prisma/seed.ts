/**
 * Seed de test : crée une ferme de démonstration avec des données réalistes
 * (reproducteurs, portée sevrée, cages, pesées étalées dans le temps,
 * alimentation) pour pouvoir tester l'app sans tout ressaisir à la main.
 *
 * Ré-exécutable sans risque : si le compte de test existe déjà, toutes ses
 * données sont d'abord supprimées avant d'être recréées — n'affecte aucun
 * autre compte.
 *
 * Usage : node --import ./prisma/resolve-typescript.mjs prisma/seed.ts
 */
import * as bcrypt from 'bcryptjs';

// Node ≥ 21.7 : charge .env/.env.local comme le CLI Prisma (pas de dotenv).
try { process.loadEnvFile('.env'); } catch {}
try { process.loadEnvFile('.env.local'); } catch {}
import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Role,
  Sexe,
  StatutAccouplement,
  StatutLapin,
  TypeCage,
  TypeMouvement,
} from '../lib/generated/prisma/enums';
import type { LapinModel } from '../lib/generated/prisma/models/Lapin';

const EMAIL_TEST = 'test@gmail.com';
const MOT_DE_PASSE_TEST = '12345678';
const EMAIL_ADMIN = 'admin@gmail.com';
const MOT_DE_PASSE_ADMIN = '12345678';
const SALT_ROUNDS = 12;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

function ilYA(jours: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - jours);
  return date;
}

function dansX(jours: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + jours);
  return date;
}

// supprime toutes les données d'un éventuel compte de test précédent, dans
// l'ordre qui respecte les contraintes de clé étrangère (cf. schema.prisma)
async function nettoyerCompteExistant(eleveurId: string) {
  await prisma.prediction.deleteMany({ where: { lapin: { eleveurId } } });
  await prisma.mouvementLapin.deleteMany({ where: { lapin: { eleveurId } } });
  await prisma.pesee.deleteMany({ where: { lapin: { eleveurId } } });
  await prisma.sante.deleteMany({ where: { lapin: { eleveurId } } });
  await prisma.distributionAlimentation.deleteMany({
    where: { stock: { eleveurId } },
  });
  await prisma.stockAlimentation.deleteMany({ where: { eleveurId } });

  // Vente référence à la fois Lapin et Client : à supprimer avant l'un et
  // l'autre
  await prisma.vente.deleteMany({ where: { eleveurId } });
  await prisma.depense.deleteMany({ where: { eleveurId } });
  await prisma.client.deleteMany({ where: { eleveurId } });

  // casse les auto-références (père/mère) et les liens vers Portee/Cage
  // avant de pouvoir tout supprimer sans violer une contrainte de clé
  // étrangère
  await prisma.lapin.updateMany({
    where: { eleveurId },
    data: { pereId: null, mereId: null, porteeId: null, cageActuelleId: null },
  });
  await prisma.portee.deleteMany({
    where: { accouplement: { male: { eleveurId } } },
  });
  await prisma.accouplement.deleteMany({ where: { male: { eleveurId } } });
  await prisma.lapin.deleteMany({ where: { eleveurId } });
  await prisma.cage.deleteMany({ where: { eleveurId } });
  await prisma.race.deleteMany({ where: { eleveurId } });
  await prisma.utilisateur.delete({ where: { id: eleveurId } });
}

async function main() {
  const existant = await prisma.utilisateur.findUnique({
    where: { email: EMAIL_TEST },
  });
  if (existant) {
    console.log(
      'Compte de test existant trouvé, nettoyage avant recréation...',
    );
    await nettoyerCompteExistant(existant.id);
  }

  const motDePasseHash = await bcrypt.hash(MOT_DE_PASSE_TEST, SALT_ROUNDS);
  const eleveur = await prisma.utilisateur.create({
    data: {
      nom: 'Testeur',
      nomFerme: 'Ferme Test',
      email: EMAIL_TEST,
      motDePasse: motDePasseHash,
    },
  });
  console.log(`Compte créé : ${EMAIL_TEST} / ${MOT_DE_PASSE_TEST}`);

  // --- Compte administrateur de la plateforme (sans données de ferme) ---
  // upsert idempotent : mot de passe/role ré-affirmés à chaque seed, le
  // compte n'est jamais supprimé ni recréé (contrairement au compte de test)
  await prisma.utilisateur.upsert({
    where: { email: EMAIL_ADMIN },
    update: { role: Role.ADMIN, actif: true },
    create: {
      nom: 'Administrateur',
      nomFerme: 'Plateforme Kunicia',
      email: EMAIL_ADMIN,
      motDePasse: await bcrypt.hash(MOT_DE_PASSE_ADMIN, SALT_ROUNDS),
      role: Role.ADMIN,
      actif: true,
    },
  });
  console.log(`Compte admin : ${EMAIL_ADMIN} / ${MOT_DE_PASSE_ADMIN}`);

  // --- Races ---
  const [raceCalifornien, raceNeoZelandais, raceChinchilla, raceLocal] =
    await Promise.all([
      prisma.race.create({
        data: {
          nom: 'Californien',
          eleveurId: eleveur.id,
          poidsAdulteMoyen: 4.2,
          paysOrigine: 'États-Unis',
          aptitude: 'Chair',
        },
      }),
      prisma.race.create({
        data: {
          nom: 'Néo-Zélandais',
          eleveurId: eleveur.id,
          poidsAdulteMoyen: 4.5,
          paysOrigine: 'Nouvelle-Zélande',
          aptitude: 'Chair',
        },
      }),
      prisma.race.create({
        data: {
          nom: 'Chinchilla',
          eleveurId: eleveur.id,
          poidsAdulteMoyen: 3.8,
          paysOrigine: 'France',
          aptitude: 'Chair et fourrure',
          caracteristiques: ['Robe grise chinée'],
        },
      }),
      prisma.race.create({
        data: {
          nom: 'Local',
          eleveurId: eleveur.id,
          aptitude: 'Chair',
          caracteristiques: ['Rusticité', 'Croissance lente'],
        },
      }),
    ]);

  // --- Cages ---
  const [cageC01, cageC02, cageC03, cageC04, cageC05, cageC06] =
    await Promise.all([
      prisma.cage.create({
        data: {
          numero: 'TEST-C-01',
          type: TypeCage.INDIVIDUELLE,
          qrCode: 'pending-TEST-C-01',
          capacite: 1,
          emplacement: 'Rangée A',
          eleveurId: eleveur.id,
        },
      }),
      prisma.cage.create({
        data: {
          numero: 'TEST-C-02',
          type: TypeCage.INDIVIDUELLE,
          qrCode: 'pending-TEST-C-02',
          capacite: 1,
          emplacement: 'Rangée A',
          eleveurId: eleveur.id,
        },
      }),
      prisma.cage.create({
        data: {
          numero: 'TEST-C-03',
          type: TypeCage.INDIVIDUELLE,
          qrCode: 'pending-TEST-C-03',
          capacite: 1,
          emplacement: 'Rangée A',
          eleveurId: eleveur.id,
        },
      }),
      prisma.cage.create({
        data: {
          numero: 'TEST-C-04',
          type: TypeCage.NID,
          qrCode: 'pending-TEST-C-04',
          capacite: 8,
          emplacement: 'Maternité',
          eleveurId: eleveur.id,
        },
      }),
      prisma.cage.create({
        data: {
          numero: 'TEST-C-05',
          type: TypeCage.COLLECTIVE,
          qrCode: 'pending-TEST-C-05',
          capacite: 6,
          emplacement: 'Rangée B',
          eleveurId: eleveur.id,
        },
      }),
      prisma.cage.create({
        data: {
          numero: 'TEST-C-06',
          type: TypeCage.COLLECTIVE,
          qrCode: 'pending-TEST-C-06',
          capacite: 2,
          emplacement: 'Rangée B',
          eleveurId: eleveur.id,
        },
      }),
    ]);

  // le qrCode encode l'id de la cage elle-même (cf. cage.service.ts) — la
  // valeur définitive n'est connue qu'une fois la ligne créée
  await Promise.all(
    [cageC01, cageC02, cageC03, cageC04, cageC05, cageC06].map((cage) =>
      prisma.cage.update({ where: { id: cage.id }, data: { qrCode: cage.id } }),
    ),
  );

  // --- Reproducteurs (origine extérieure) ---
  const milo = await prisma.lapin.create({
    data: {
      codeIdentification: 'TEST-EXT-26-001',
      nom: 'Milo',
      raceId: raceCalifornien.id,
      sexe: Sexe.MALE,
      dateNaissance: ilYA(250),
      statut: StatutLapin.REPRODUCTEUR,
      origineExterieure: true,
      eleveurId: eleveur.id,
      cageActuelleId: cageC01.id,
    },
  });
  const rex = await prisma.lapin.create({
    data: {
      codeIdentification: 'TEST-EXT-26-002',
      nom: 'Rex',
      raceId: raceNeoZelandais.id,
      sexe: Sexe.MALE,
      dateNaissance: ilYA(230),
      statut: StatutLapin.REPRODUCTEUR,
      origineExterieure: true,
      eleveurId: eleveur.id,
      cageActuelleId: cageC02.id,
    },
  });
  const bella = await prisma.lapin.create({
    data: {
      codeIdentification: 'TEST-EXT-26-003',
      nom: 'Bella',
      raceId: raceCalifornien.id,
      sexe: Sexe.FEMELLE,
      dateNaissance: ilYA(240),
      statut: StatutLapin.REPRODUCTEUR,
      origineExterieure: true,
      eleveurId: eleveur.id,
      cageActuelleId: cageC03.id,
    },
  });
  const luna = await prisma.lapin.create({
    data: {
      codeIdentification: 'TEST-EXT-26-004',
      nom: 'Luna',
      raceId: raceChinchilla.id,
      sexe: Sexe.FEMELLE,
      dateNaissance: ilYA(220),
      statut: StatutLapin.REPRODUCTEUR,
      origineExterieure: true,
      eleveurId: eleveur.id,
      cageActuelleId: cageC06.id,
    },
  });
  const noisette = await prisma.lapin.create({
    data: {
      codeIdentification: 'TEST-EXT-26-005',
      nom: 'Noisette',
      raceId: raceLocal.id,
      sexe: Sexe.FEMELLE,
      dateNaissance: ilYA(70),
      statut: StatutLapin.EN_CROISSANCE,
      origineExterieure: true,
      eleveurId: eleveur.id,
      cageActuelleId: cageC06.id,
    },
  });

  await prisma.mouvementLapin.createMany({
    data: [
      {
        lapinId: milo.id,
        cageId: cageC01.id,
        typeMouvement: TypeMouvement.ENTREE_CAGE,
        dateMouvement: ilYA(250),
      },
      {
        lapinId: rex.id,
        cageId: cageC02.id,
        typeMouvement: TypeMouvement.ENTREE_CAGE,
        dateMouvement: ilYA(230),
      },
      {
        lapinId: bella.id,
        cageId: cageC03.id,
        typeMouvement: TypeMouvement.ENTREE_CAGE,
        dateMouvement: ilYA(240),
      },
      {
        lapinId: luna.id,
        cageId: cageC06.id,
        typeMouvement: TypeMouvement.ENTREE_CAGE,
        dateMouvement: ilYA(220),
      },
      {
        lapinId: noisette.id,
        cageId: cageC06.id,
        typeMouvement: TypeMouvement.ENTREE_CAGE,
        dateMouvement: ilYA(70),
      },
    ],
  });

  // --- Accouplement validé + portée déjà sevrée (Milo x Bella) ---
  const accouplementValide = await prisma.accouplement.create({
    data: {
      maleId: milo.id,
      femelleId: bella.id,
      dateAccouplement: ilYA(65),
      coefficientParente: 0,
      typeParente: null, // lapins d'origine extérieure, non apparentés
      statut: StatutAccouplement.VALIDE,
    },
  });

  const portee = await prisma.portee.create({
    data: {
      accouplementId: accouplementValide.id,
      dateNaissance: ilYA(50),
      nombreNes: 6,
      dateSevrage: ilYA(20),
      poidsMoyenNaissance: 0.06,
    },
  });

  const anneeCourte = new Date(ilYA(50)).getFullYear().toString().slice(-2);
  const prefixeCode = `${bella.codeIdentification}-${anneeCourte}-`;
  const offspringDefs = [
    { numero: '01', nom: 'Filou', sexe: Sexe.MALE },
    { numero: '02', nom: 'Praline', sexe: Sexe.FEMELLE },
    { numero: '03', nom: null, sexe: Sexe.FEMELLE },
    { numero: '04', nom: 'Câline', sexe: Sexe.FEMELLE },
    { numero: '05', nom: null, sexe: Sexe.MALE },
  ];

  const petits: LapinModel[] = [];
  for (const def of offspringDefs) {
    const petit = await prisma.lapin.create({
      data: {
        codeIdentification: `${prefixeCode}${def.numero}`,
        nom: def.nom,
        raceId: raceCalifornien.id,
        sexe: def.sexe,
        dateNaissance: ilYA(50),
        statut: StatutLapin.EN_CROISSANCE,
        origineExterieure: false,
        eleveurId: eleveur.id,
        pereId: milo.id,
        mereId: bella.id,
        porteeId: portee.id,
        cageActuelleId: cageC05.id,
      },
    });
    petits.push(petit);
  }

  await prisma.mouvementLapin.createMany({
    data: petits.map((petit) => ({
      lapinId: petit.id,
      cageId: cageC05.id,
      typeMouvement: TypeMouvement.ENTREE_CAGE,
      dateMouvement: ilYA(20),
    })),
  });

  // --- Accouplements en attente ---
  // Rex x Luna : lapins non-apparentés, aucune alerte à valider
  await prisma.accouplement.create({
    data: {
      maleId: rex.id,
      femelleId: luna.id,
      dateAccouplement: ilYA(2),
      coefficientParente: 0,
      typeParente: null,
      statut: StatutAccouplement.EN_ATTENTE,
    },
  });

  // Filou x Praline : frère/sœur (mêmes parents Milo/Bella) — pour tester le
  // parcours "alerte forte / validation malgré alerte avec motif obligatoire".
  // typeParente reprend le même libellé que produirait
  // accouplement.service.ts (libelleTypeParente) pour ce cas précis (deux
  // parents communs).
  const filou = petits[0];
  const praline = petits[1];
  await prisma.accouplement.create({
    data: {
      maleId: filou.id,
      femelleId: praline.id,
      dateAccouplement: ilYA(1),
      coefficientParente: 0.25,
      typeParente: 'Frère et sœur (mêmes parents)',
      statut: StatutAccouplement.EN_ATTENTE,
    },
  });

  // --- Pesées ---
  // adultes : historique large (>=3 jours d'écart entre chaque pesée, cf.
  // seuil de fiabilité de la tendance de croissance)
  const peseesAdultes: { lapinId: string; poids: number; date: Date }[] = [
    { lapinId: milo.id, poids: 3.7, date: ilYA(60) },
    { lapinId: milo.id, poids: 3.85, date: ilYA(30) },
    { lapinId: milo.id, poids: 3.95, date: ilYA(5) },

    { lapinId: rex.id, poids: 4.1, date: ilYA(45) },
    { lapinId: rex.id, poids: 4.3, date: ilYA(15) },

    { lapinId: bella.id, poids: 3.5, date: ilYA(90) },
    { lapinId: bella.id, poids: 3.6, date: ilYA(20) },

    { lapinId: luna.id, poids: 3.6, date: ilYA(50) },
    { lapinId: luna.id, poids: 3.75, date: ilYA(10) },

    { lapinId: noisette.id, poids: 1.8, date: ilYA(40) },
    { lapinId: noisette.id, poids: 2.3, date: ilYA(20) },
    { lapinId: noisette.id, poids: 2.6, date: ilYA(4) },
  ];

  // petits sevrés : pesées depuis le sevrage (il y a 20 jours), croissance
  // rapide typique d'un jeune lapin
  const poidsSevrageParPetit = [0.65, 0.6, 0.58, 0.62, 0.57];
  const peseesPetits = petits.flatMap((petit, index) => [
    { lapinId: petit.id, poids: poidsSevrageParPetit[index], date: ilYA(20) },
    {
      lapinId: petit.id,
      poids: poidsSevrageParPetit[index] + 0.45,
      date: ilYA(10),
    },
    {
      lapinId: petit.id,
      poids: poidsSevrageParPetit[index] + 0.85,
      date: ilYA(3),
    },
  ]);

  await prisma.pesee.createMany({ data: [...peseesAdultes, ...peseesPetits] });

  // --- Santé ---
  await prisma.sante.createMany({
    data: [
      {
        lapinId: milo.id,
        type: 'Vaccination VHD',
        date: ilYA(200),
        dateRappel: dansX(165), // rappel annuel, pas encore urgent
      },
      {
        lapinId: rex.id,
        type: 'Vaccination Myxomatose',
        date: ilYA(180),
        dateRappel: dansX(185),
      },
      {
        lapinId: bella.id,
        type: 'Vaccination VHD',
        date: ilYA(90),
        // rappel proche (< 7 jours) — pour tester la mise en évidence dans
        // l'UI de la page Santé
        dateRappel: dansX(5),
      },
      {
        lapinId: noisette.id,
        type: 'Vermifuge',
        date: ilYA(10),
        notes: 'Traitement préventif de routine',
      },
      {
        lapinId: petits[0].id,
        type: 'Premier vaccin',
        date: ilYA(5),
        dateRappel: dansX(20),
      },
    ],
  });

  // --- Alimentation ---
  const stockGranules = await prisma.stockAlimentation.create({
    data: {
      typeAliment: 'Granulés croissance',
      quantiteInitiale: 200,
      quantiteRestante: 140,
      dateAchat: ilYA(20),
      eleveurId: eleveur.id,
    },
  });
  const stockFoin = await prisma.stockAlimentation.create({
    data: {
      typeAliment: 'Foin',
      quantiteInitiale: 50,
      quantiteRestante: 8,
      dateAchat: ilYA(10),
      eleveurId: eleveur.id,
    },
  });

  const consommationGranules = 0.12 * petits.length; // kg/jour/lapin * nb lapins
  await prisma.distributionAlimentation.create({
    data: {
      stockId: stockGranules.id,
      cageId: cageC05.id,
      quantiteParJour: 0.12,
      nombreLapins: petits.length,
      dateDebut: ilYA(15),
      consommationJournaliere: consommationGranules,
      dateEpuisementEstimee: new Date(
        Date.now() + (140 / consommationGranules) * 24 * 60 * 60 * 1000,
      ),
    },
  });

  const consommationFoin = 0.05 * (petits.length + 5);
  await prisma.distributionAlimentation.create({
    data: {
      stockId: stockFoin.id,
      cageId: null, // toute la ferme
      quantiteParJour: 0.05,
      nombreLapins: petits.length + 5,
      dateDebut: ilYA(8),
      consommationJournaliere: consommationFoin,
      // volontairement proche de l'épuisement (stock de foin bas), pour
      // tester l'alerte "stocks à renouveler bientôt" du tableau de bord
      dateEpuisementEstimee: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  // --- Finance ---
  const [clientKouassi, clientDiallo] = await Promise.all([
    prisma.client.create({
      data: { nom: 'Kouassi Yao', telephone: '0102030405', eleveurId: eleveur.id },
    }),
    prisma.client.create({
      data: { nom: 'Diallo Aminata', eleveurId: eleveur.id },
    }),
  ]);

  // vente du dernier petit (05, sans nom) — même effets de bord que
  // VenteService.create() : Vente + MouvementLapin(VENTE) + statut VENDU
  const lapinVendu = petits[4];
  await prisma.$transaction([
    prisma.vente.create({
      data: {
        lapinId: lapinVendu.id,
        clientId: clientKouassi.id,
        prix: 8500,
        dateVente: ilYA(2),
        eleveurId: eleveur.id,
      },
    }),
    prisma.mouvementLapin.create({
      data: {
        lapinId: lapinVendu.id,
        typeMouvement: TypeMouvement.VENTE,
        dateMouvement: ilYA(2),
      },
    }),
    prisma.lapin.update({
      where: { id: lapinVendu.id },
      data: { statut: StatutLapin.VENDU, cageActuelleId: null },
    }),
  ]);

  await prisma.depense.createMany({
    data: [
      {
        categorie: 'Alimentation',
        libelle: 'Achat granulés croissance',
        montant: 25000,
        date: ilYA(20),
        eleveurId: eleveur.id,
      },
      {
        categorie: 'Vétérinaire',
        libelle: 'Consultation + vaccination',
        montant: 12000,
        date: ilYA(10),
        eleveurId: eleveur.id,
      },
      {
        categorie: 'Équipement',
        libelle: 'Réparation clapier C-05',
        montant: 5000,
        date: ilYA(5),
        eleveurId: eleveur.id,
      },
    ],
  });

  // --- Lot non identifié (démo de la création en lot — cf. lapin.service.ts createLot) ---
  const codesNonIdentifies = ['TEST-EXT-26-006', 'TEST-EXT-26-007'];
  const lapinsNonIdentifies: LapinModel[] = [];
  for (const codeIdentification of codesNonIdentifies) {
    const lapin = await prisma.lapin.create({
      data: {
        codeIdentification,
        origineExterieure: true,
        identifie: false,
        eleveurId: eleveur.id,
        cageActuelleId: cageC04.id,
      },
    });
    lapinsNonIdentifies.push(lapin);
  }
  await prisma.mouvementLapin.createMany({
    data: lapinsNonIdentifies.map((lapin) => ({
      lapinId: lapin.id,
      cageId: cageC04.id,
      typeMouvement: TypeMouvement.ENTREE_CAGE,
      dateMouvement: ilYA(1),
    })),
  });

  console.log('Seed terminé :');
  console.log(`  - 1 compte éleveur (${EMAIL_TEST})`);
  console.log('  - 4 races');
  console.log('  - 6 cages');
  console.log(
    '  - 10 lapins (5 reproducteurs + 4 petits sevrés + 1 vendu) + 2 non identifiés',
  );
  console.log(
    '  - 3 accouplements (1 validé + portée sevrée, 2 en attente dont 1 avec alerte forte)',
  );
  console.log(`  - ${peseesAdultes.length + peseesPetits.length} pesées`);
  console.log('  - 5 suivis santé (dont 1 rappel proche pour tester l\'alerte)');
  console.log('  - 2 stocks alimentation + 2 distributions');
  console.log('  - 2 clients, 1 vente, 3 dépenses');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
