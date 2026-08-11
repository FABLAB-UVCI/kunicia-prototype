import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';

export const DOSSIER_PHOTOS_LAPIN = join(process.cwd(), 'uploads', 'lapins');

// même nom de fichier à chaque upload pour un même lapin (écrase l'ancienne
// photo au lieu d'en accumuler une nouvelle à chaque remplacement)
export function creerStorageLapinPhoto() {
  if (!existsSync(DOSSIER_PHOTOS_LAPIN)) {
    mkdirSync(DOSSIER_PHOTOS_LAPIN, { recursive: true });
  }

  return diskStorage({
    destination: DOSSIER_PHOTOS_LAPIN,
    filename: (req, file, callback) => {
      const id = (req.params as { id: string }).id;
      const extension = extname(file.originalname) || '.jpg';
      callback(null, `${id}${extension}`);
    },
  });
}
