"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { LoginFormValues, loginSchema } from "@/lib/validation/auth";

// n'accepte qu'un chemin interne : une valeur commençant par "//" ou par un
// schéma serait une URL externe, et permettrait de rediriger l'utilisateur
// hors du site après connexion
function destinationSure(suivant: string | null): string {
  if (!suivant) return "/dashboard";
  if (!suivant.startsWith("/") || suivant.startsWith("//")) return "/dashboard";
  return suivant;
}

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connexion } = useAuth();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setErreur(null);
    try {
      await connexion(values);
      router.push(destinationSure(searchParams.get("suivant")));
    } catch (error) {
      setErreur(
        error instanceof ApiError ? error.message : "Une erreur est survenue",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Accède à ton espace éleveur</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="mb-3 flex flex-col gap-1.5">
            <Label htmlFor="motDePasse">Mot de passe</Label>
            <PasswordInput
              id="motDePasse"
              autoComplete="current-password"
              {...register("motDePasse")}
            />
            {errors.motDePasse && (
              <p className="text-sm text-destructive">
                {errors.motDePasse.message}
              </p>
            )}
          </div>
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="text-primary underline-offset-4 hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionContent />
    </Suspense>
  );
}
