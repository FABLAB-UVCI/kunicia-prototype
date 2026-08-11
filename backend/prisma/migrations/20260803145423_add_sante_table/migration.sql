-- CreateTable
CREATE TABLE "Sante" (
    "id" TEXT NOT NULL,
    "lapinId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRappel" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Sante_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Sante" ADD CONSTRAINT "Sante_lapinId_fkey" FOREIGN KEY ("lapinId") REFERENCES "Lapin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
