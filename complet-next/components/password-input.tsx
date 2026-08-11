"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  ref,
  ...props
}: React.ComponentProps<"input"> & { ref?: React.Ref<HTMLInputElement> }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        // en dessous de 16px, Safari/Chrome mobile zooment automatiquement
        // la page au focus du champ (pensé pour l'accessibilité) — text-base
        // (16px) l'évite sur mobile ; text-xs ne s'applique qu'à partir du
        // breakpoint desktop, où ce zoom n'existe de toute façon pas
        className={cn("text-base md:text-xs", className)}
        {...props}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? "Masquer" : "Afficher"}
      </Button>
    </div>
  );
}
