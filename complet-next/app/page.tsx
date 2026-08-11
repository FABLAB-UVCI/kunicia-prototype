"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const router = useRouter();
  const { estConnecte, chargementInitial } = useAuth();

  useEffect(() => {
    if (!chargementInitial) {
      router.replace(estConnecte ? "/dashboard" : "/connexion");
    }
  }, [chargementInitial, estConnecte, router]);

  return null;
}
