"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { RegisterFormValues, registerSchema } from "@/lib/validation/auth";

export default function InscriptionPage() {
  const router = useRouter();
  const { inscription } = useAuth();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    setErreur(null);
    try {
      // confirmationMotDePasse ne sert qu'à la validation côté front — le
      // backend rejette (403) toute propriété non attendue dans le DTO
      await inscription({
        nom: values.nom,
        nomFerme: values.nomFerme,
        email: values.email,
        motDePasse: values.motDePasse,
      });
      router.push("/dashboard");
    } catch (error) {
      setErreur(
        error instanceof ApiError ? error.message : "Une erreur est survenue",
      );
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>Un compte par ferme</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" autoComplete="name" {...register("nom")} />
            {errors.nom && (
              <p className="text-sm text-destructive">{errors.nom.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nomFerme">Nom de la ferme</Label>
            <Input id="nomFerme" {...register("nomFerme")} />
            {errors.nomFerme && (
              <p className="text-sm text-destructive">
                {errors.nomFerme.message}
              </p>
            )}
          </div>
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motDePasse">Mot de passe</Label>
            <PasswordInput
              id="motDePasse"
              autoComplete="new-password"
              {...register("motDePasse")}
            />
            {errors.motDePasse && (
              <p className="text-sm text-destructive">
                {errors.motDePasse.message}
              </p>
            )}
          </div>
          <div className="mb-1 flex flex-col gap-1.5">
            <Label htmlFor="confirmationMotDePasse">Confirmer le mot de passe</Label>
            <PasswordInput
              id="confirmationMotDePasse"
              autoComplete="new-password"
              {...register("confirmationMotDePasse")}
            />
            {errors.confirmationMotDePasse && (
              <p className="text-sm text-destructive">
                {errors.confirmationMotDePasse.message}
              </p>
            )}
          </div>
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer mon compte"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link
              href="/connexion"
              className="text-primary underline-offset-4 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
