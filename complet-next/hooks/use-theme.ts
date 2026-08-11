"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const CLE_THEME = "cunicole_theme";

type Ecouteur = () => void;
const ecouteurs = new Set<Ecouteur>();

function lireTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function lireThemeCoteServeur(): Theme {
  return "light";
}

function sabonner(ecouteur: Ecouteur): () => void {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
}

export function basculerTheme(): void {
  const nouveauTheme: Theme = lireTheme() === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle("dark", nouveauTheme === "dark");
  localStorage.setItem(CLE_THEME, nouveauTheme);
  ecouteurs.forEach((ecouteur) => ecouteur());
}

export function useTheme(): Theme {
  return useSyncExternalStore(sabonner, lireTheme, lireThemeCoteServeur);
}
