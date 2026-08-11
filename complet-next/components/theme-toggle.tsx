"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { basculerTheme, useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const theme = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={basculerTheme}
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
