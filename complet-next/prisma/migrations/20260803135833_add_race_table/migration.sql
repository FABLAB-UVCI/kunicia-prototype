-- AlterTable
ALTER TABLE "Lapin" ADD COLUMN     "raceId" TEXT;

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "poidsAdulteMoyen" DOUBLE PRECISION,
    "paysOrigine" TEXT,
    "aptitude" TEXT,
    "caracteristiques" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eleveurId" TEXT NOT NULL,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Race_eleveurId_nom_key" ON "Race"("eleveurId", "nom");

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_eleveurId_fkey" FOREIGN KEY ("eleveurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
