-- Finalise la migration race (texte libre) -> Race (table dédiée).
-- Le backfill (script one-off, déjà exécuté) a rempli Lapin.raceId pour
-- toutes les lignes existantes : ce DROP COLUMN ne perd aucune information,
-- elle est déjà dupliquée dans la table Race + Lapin.raceId.

-- AlterTable
ALTER TABLE "Lapin" ALTER COLUMN "raceId" SET NOT NULL;
ALTER TABLE "Lapin" DROP COLUMN "race";

-- AddForeignKey
ALTER TABLE "Lapin" ADD CONSTRAINT "Lapin_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
