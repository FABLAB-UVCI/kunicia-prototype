// photoUrl est un chemin renvoyé par le backend (ex: "/uploads/lapins/xxx.jpg").
// Depuis la refonte, les photos sont servies statiquement par Next depuis
// public/ — on renvoie donc le chemin tel quel, sans passer par le proxy /api.
export function urlPhotoLapin(photoUrl: string | null): string | null {
  return photoUrl;
}

export const PHOTO_BANNIERE_DASHBOARD = "/lapin10.jpg";
