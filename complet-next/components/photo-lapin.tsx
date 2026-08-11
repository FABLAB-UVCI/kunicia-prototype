"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Camera, Rabbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploaderPhotoLapin } from "@/hooks/queries/use-lapins";
import { urlPhotoLapin } from "@/lib/photo-lapin";
import { ApiError } from "@/lib/api/client";

export function PhotoLapin({
  lapinId,
  photoUrl,
  size = 56,
}: {
  lapinId: string;
  photoUrl: string | null;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const uploaderPhoto = useUploaderPhotoLapin(lapinId);
  const url = urlPhotoLapin(photoUrl);

  async function onFichierChoisi(fichier: File | undefined) {
    if (!fichier) return;
    setErreur(null);
    try {
      await uploaderPhoto.mutateAsync(fichier);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : "Échec de l'envoi de la photo");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {url ? (
          <Image
            src={url}
            alt=""
            width={size}
            height={size}
            className="size-full rounded-full object-cover ring-1 ring-foreground/10"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center rounded-full bg-muted ring-1 ring-foreground/10"
            aria-hidden
          >
            <Rabbit className="size-1/2 text-muted-foreground" />
          </div>
        )}
        <Button
          type="button"
          size="icon-xs"
          variant="secondary"
          className="absolute -right-1 -bottom-1 rounded-full shadow"
          disabled={uploaderPhoto.isPending}
          onClick={() => inputRef.current?.click()}
          aria-label="Prendre ou choisir une photo"
        >
          <Camera />
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onFichierChoisi(e.target.files?.[0])}
        />
      </div>
      {erreur && <p className="text-xs text-destructive">{erreur}</p>}
    </div>
  );
}
