-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ELEVEUR', 'ADMIN');

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ELEVEUR',
ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true;
