-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('MALE', 'FEMELLE');

-- CreateEnum
CREATE TYPE "StatutLapin" AS ENUM ('EN_CROISSANCE', 'REPRODUCTEUR', 'VENDU', 'DECEDE');

-- CreateEnum
CREATE TYPE "StatutAccouplement" AS ENUM ('EN_ATTENTE', 'VALIDE', 'VALIDE_MALGRE_ALERTE', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeCage" AS ENUM ('INDIVIDUELLE', 'COLLECTIVE', 'NID');

-- CreateEnum
CREATE TYPE "TypeMouvement" AS ENUM ('ENTREE_CAGE', 'DECES', 'VENTE', 'CONTROLE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomFerme" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lapin" (
    "id" TEXT NOT NULL,
    "codeIdentification" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "sexe" "Sexe" NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "statut" "StatutLapin" NOT NULL DEFAULT 'EN_CROISSANCE',
    "pereId" TEXT,
    "mereId" TEXT,
    "origineExterieure" BOOLEAN NOT NULL DEFAULT false,
    "eleveurId" TEXT NOT NULL,
    "porteeId" TEXT,
    "cageActuelleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lapin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portee" (
    "id" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "nombreNes" INTEGER NOT NULL,
    "dateSevrage" TIMESTAMP(3),
    "poidsMoyenNaissance" DOUBLE PRECISION,
    "accouplementId" TEXT NOT NULL,

    CONSTRAINT "Portee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accouplement" (
    "id" TEXT NOT NULL,
    "maleId" TEXT NOT NULL,
    "femelleId" TEXT NOT NULL,
    "dateAccouplement" TIMESTAMP(3) NOT NULL,
    "coefficientParente" DOUBLE PRECISION NOT NULL,
    "statut" "StatutAccouplement" NOT NULL DEFAULT 'EN_ATTENTE',
    "motifValidationForcee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Accouplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cage" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" "TypeCage" NOT NULL,
    "qrCode" TEXT NOT NULL,
    "capacite" INTEGER,
    "emplacement" TEXT,
    "eleveurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementLapin" (
    "id" TEXT NOT NULL,
    "lapinId" TEXT NOT NULL,
    "cageId" TEXT,
    "typeMouvement" "TypeMouvement" NOT NULL,
    "dateMouvement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,

    CONSTRAINT "MouvementLapin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pesee" (
    "id" TEXT NOT NULL,
    "lapinId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poids" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Pesee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "lapinId" TEXT NOT NULL,
    "dateCalcul" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poidsPredit" DOUBLE PRECISION NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "poidsReel" DOUBLE PRECISION,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAlimentation" (
    "id" TEXT NOT NULL,
    "typeAliment" TEXT NOT NULL,
    "quantiteInitiale" DOUBLE PRECISION NOT NULL,
    "quantiteRestante" DOUBLE PRECISION NOT NULL,
    "dateAchat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eleveurId" TEXT NOT NULL,

    CONSTRAINT "StockAlimentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionAlimentation" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "cageId" TEXT,
    "quantiteParJour" DOUBLE PRECISION NOT NULL,
    "nombreLapins" INTEGER NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consommationJournaliere" DOUBLE PRECISION NOT NULL,
    "dateEpuisementEstimee" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionAlimentation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lapin_codeIdentification_key" ON "Lapin"("codeIdentification");

-- CreateIndex
CREATE UNIQUE INDEX "Portee_accouplementId_key" ON "Portee"("accouplementId");

-- CreateIndex
CREATE UNIQUE INDEX "Cage_numero_key" ON "Cage"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Cage_qrCode_key" ON "Cage"("qrCode");

-- AddForeignKey
ALTER TABLE "Lapin" ADD CONSTRAINT "Lapin_pereId_fkey" FOREIGN KEY ("pereId") REFERENCES "Lapin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lapin" ADD CONSTRAINT "Lapin_mereId_fkey" FOREIGN KEY ("mereId") REFERENCES "Lapin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lapin" ADD CONSTRAINT "Lapin_eleveurId_fkey" FOREIGN KEY ("eleveurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lapin" ADD CONSTRAINT "Lapin_porteeId_fkey" FOREIGN KEY ("porteeId") REFERENCES "Portee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lapin" ADD CONSTRAINT "Lapin_cageActuelleId_fkey" FOREIGN KEY ("cageActuelleId") REFERENCES "Cage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portee" ADD CONSTRAINT "Portee_accouplementId_fkey" FOREIGN KEY ("accouplementId") REFERENCES "Accouplement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accouplement" ADD CONSTRAINT "Accouplement_maleId_fkey" FOREIGN KEY ("maleId") REFERENCES "Lapin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accouplement" ADD CONSTRAINT "Accouplement_femelleId_fkey" FOREIGN KEY ("femelleId") REFERENCES "Lapin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cage" ADD CONSTRAINT "Cage_eleveurId_fkey" FOREIGN KEY ("eleveurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementLapin" ADD CONSTRAINT "MouvementLapin_lapinId_fkey" FOREIGN KEY ("lapinId") REFERENCES "Lapin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementLapin" ADD CONSTRAINT "MouvementLapin_cageId_fkey" FOREIGN KEY ("cageId") REFERENCES "Cage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesee" ADD CONSTRAINT "Pesee_lapinId_fkey" FOREIGN KEY ("lapinId") REFERENCES "Lapin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_lapinId_fkey" FOREIGN KEY ("lapinId") REFERENCES "Lapin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlimentation" ADD CONSTRAINT "StockAlimentation_eleveurId_fkey" FOREIGN KEY ("eleveurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionAlimentation" ADD CONSTRAINT "DistributionAlimentation_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "StockAlimentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
