// Le QR d'une cage encode une URL absolue vers sa fiche, et non l'identifiant
// brut : l'appareil photo natif du téléphone sait alors proposer d'ouvrir
// directement la page (une chaîne brute ne lui inspire qu'une recherche web).
//
// L'identité encodée reste bien celle de la cage (cf. cahier des charges §8.3) :
// le domaine n'est qu'un transport, l'identifiant reste le même en base.

export function urlCage(idCage: string): string {
  // NEXT_PUBLIC_APP_URL fixe l'origine encodée dans le QR, indépendamment de
  // celle depuis laquelle on consulte la page : la fiche cage est affichée
  // sur l'ordinateur (localhost) mais le QR est scanné par un téléphone, pour
  // qui "localhost" désigne le téléphone lui-même et non le serveur.
  // À défaut, on retombe sur l'origine courante.
  const origine =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window === "undefined" ? "" : window.location.origin);

  return `${origine}/cages/${idCage}`;
}
