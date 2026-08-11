"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { StatusBadge } from "@/components/status-badge";
import { SkeletonDetail } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCage } from "@/hooks/queries/use-cages";
import {
  libelleSexe,
  LABEL_STATUT_CAGE,
  LABEL_TYPE_CAGE,
  TONE_STATUT_CAGE,
} from "@/lib/labels";
import { nomAffiche } from "@/lib/format-lapin";
import { urlCage } from "@/lib/qr-cage";

export default function CageDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: cage, isLoading } = useCage(params.id);

  if (isLoading) {
    return <SkeletonDetail />;
  }

  if (!cage) {
    return <EmptyState title="Clapier introuvable" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Clapier {cage.numero}</h1>
          <p className="text-muted-foreground">
            {cage.emplacement ?? "Emplacement non renseigné"}
          </p>
        </div>
        <StatusBadge
          label={LABEL_STATUT_CAGE[cage.statut]}
          tone={TONE_STATUT_CAGE[cage.statut]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Type</p>
          <p className="font-medium">{LABEL_TYPE_CAGE[cage.type]}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Occupants</p>
          <p className="font-medium">{cage.nombreOccupants}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Capacité</p>
          <p className="font-medium">{cage.capacite ?? "—"}</p>
        </div>
      </div>

      <div>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            Voir le QR du clapier
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR code — Clapier {cage.numero}</DialogTitle>
              <DialogDescription>
                À imprimer et fixer sur le clapier — reste valable en
                permanence, quel que soit le lapin qui l&apos;occupe. Scanné
                avec l&apos;appareil photo du téléphone, il ouvre directement
                cette fiche.
              </DialogDescription>
            </DialogHeader>

            {/* marqué pour l'impression : seul ce bloc est imprimé, le reste
                de la page et l'habillage du modal sont masqués (cf. la règle
                @media print dans globals.css) */}
            <div
              data-impression-qr
              className="flex flex-col items-center gap-2 rounded-lg bg-white p-4"
            >
              <QRCodeSVG value={urlCage(cage.id)} size={200} />
              <p className="text-sm font-medium text-black">
                Clapier {cage.numero}
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                Imprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Occupants actuels</h2>
        {cage.occupants.length === 0 ? (
          <p className="text-muted-foreground">Aucun lapin dans ce clapier.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {cage.occupants.map((lapin) => (
              <Link
                key={lapin.id}
                href={`/lapins/${lapin.id}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                <span>{nomAffiche(lapin)}</span>
                <span className="text-muted-foreground">{libelleSexe(lapin.sexe)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
