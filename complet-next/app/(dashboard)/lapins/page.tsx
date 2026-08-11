"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { SkeletonRows } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useLapins } from "@/hooks/queries/use-lapins";
import { TONE_STATUT_LAPIN, libelleSexe, libelleStatutLapin } from "@/lib/labels";
import { Sexe, StatutLapin } from "@/lib/types/enums";
import { nomAffiche } from "@/lib/format-lapin";

export default function LapinsPage() {
  const [statut, setStatut] = useState<StatutLapin | "">("");
  const [sexe, setSexe] = useState<Sexe | "">("");
  const [origine, setOrigine] = useState<"" | "EXTERIEURE" | "FERME">("");
  const [identification, setIdentification] = useState<
    "" | "NON_IDENTIFIE" | "IDENTIFIE"
  >("");
  const [recherche, setRecherche] = useState("");

  const { data: lapins, isLoading } = useLapins({
    statut: statut || undefined,
    sexe: sexe || undefined,
    origineExterieure:
      origine === "" ? undefined : origine === "EXTERIEURE",
  });

  // recherche par identifiant ou nom, en plus des filtres ci-dessus — utile
  // pour un éleveur qui a beaucoup de lapins et veut en retrouver un
  // précisément (identifiant noté sur une fiche papier, une cage, etc.)
  const termeRecherche = recherche.trim().toLowerCase();
  const lapinsAffiches = lapins?.filter((l) => {
    if (identification === "NON_IDENTIFIE" && l.identifie) return false;
    if (identification === "IDENTIFIE" && !l.identifie) return false;
    return (
      !termeRecherche ||
      l.codeIdentification.toLowerCase().includes(termeRecherche) ||
      (l.nom ?? "").toLowerCase().includes(termeRecherche)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Lapins</h1>
        <Link href="/lapins/nouveau">
          <Button size="sm">Nouveau lapin</Button>
        </Link>
      </div>

      <Input
        placeholder="Rechercher par identifiant ou nom..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        className="sm:max-w-xs"
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={statut}
          onChange={(e) => setStatut(e.target.value as StatutLapin | "")}
        >
          <option value="">Tous les statuts</option>
          <option value="EN_CROISSANCE">En croissance</option>
          <option value="REPRODUCTEUR">Reproducteur</option>
          <option value="VENDU">Vendu</option>
          <option value="DECEDE">Décédé</option>
        </Select>
        <Select
          value={sexe}
          onChange={(e) => setSexe(e.target.value as Sexe | "")}
        >
          <option value="">Mâle et femelle</option>
          <option value="MALE">Mâle</option>
          <option value="FEMELLE">Femelle</option>
        </Select>
        <Select
          value={origine}
          onChange={(e) => setOrigine(e.target.value as "" | "EXTERIEURE" | "FERME")}
        >
          <option value="">Toutes origines</option>
          <option value="FERME">Né à la ferme</option>
          <option value="EXTERIEURE">Acheté</option>
        </Select>
        <Select
          value={identification}
          onChange={(e) =>
            setIdentification(e.target.value as "" | "NON_IDENTIFIE" | "IDENTIFIE")
          }
        >
          <option value="">Identifiés et non identifiés</option>
          <option value="NON_IDENTIFIE">Non identifiés seulement</option>
          <option value="IDENTIFIE">Identifiés seulement</option>
        </Select>
      </div>

      {isLoading && <SkeletonRows />}

      {!isLoading && lapinsAffiches && lapinsAffiches.length > 0 && (
        <div className="flex flex-col gap-2">
          {lapinsAffiches.map((lapin) => (
            <Link
              key={lapin.id}
              href={`/lapins/${lapin.id}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              <div>
                <p className="font-medium">{nomAffiche(lapin)}</p>
                {lapin.identifie && (
                  <p className="text-muted-foreground">{libelleSexe(lapin.sexe)}</p>
                )}
                <p className="text-xs text-muted-foreground">{lapin.codeIdentification}</p>
              </div>
              <div className="flex gap-2">
                {lapin.identifie ? (
                  <>
                    <StatusBadge
                      label={lapin.origineExterieure ? "Acheté" : "Né à la ferme"}
                      tone="neutral"
                    />
                    <StatusBadge
                      label={libelleStatutLapin(lapin.statut, lapin.sexe)}
                      tone={TONE_STATUT_LAPIN[lapin.statut]}
                    />
                  </>
                ) : (
                  <StatusBadge label="Non identifié" tone="warning" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && lapinsAffiches?.length === 0 && (
        <EmptyState
          title="Aucun lapin trouvé"
          description="Ajuste la recherche, les filtres, ou crée un nouveau lapin."
        />
      )}
    </div>
  );
}
