import { prisma } from "@/lib/server/prisma";

// retrouve une portée appartenant à l'éleveur : l'ownership passe par le
// mâle de l'accouplement (la portée appartient à celui qui possède le mâle).
// null si la portée n'existe pas ou n'est pas à lui.
export function obtenirPorteeOwned(eleveurId: string, id: string) {
  return prisma.portee.findFirst({
    where: { id, accouplement: { male: { eleveurId } } },
  });
}
