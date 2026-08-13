"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart3, ShieldCheck, UsersRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const ONGLETS = [
  { href: "/admin", label: "Éleveurs", icon: UsersRound },
  { href: "/admin/stats", label: "Statistiques", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { estConnecte, chargementInitial, utilisateur, deconnexion } = useAuth();

  useEffect(() => {
    if (chargementInitial) return;
    if (!estConnecte) {
      router.replace(`/connexion?suivant=${encodeURIComponent(pathname ?? "/admin")}`);
      return;
    }
    if (utilisateur && utilisateur.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [chargementInitial, estConnecte, utilisateur, pathname, router]);

  if (chargementInitial || !estConnecte || (utilisateur && utilisateur.role !== "ADMIN")) {
    return null;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="relative flex flex-col gap-3 border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <ShieldCheck className="size-4.5" />
            </span>
            <div>
              <p className="font-medium">Administration</p>
              <p className="text-xs text-muted-foreground">Kunicia — gestion de la plateforme</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ArrowLeft />
              Retour à mon élevage
            </Link>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={deconnexion}>
              Déconnexion
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {ONGLETS.map((onglet) => {
            const estActif = pathname === onglet.href;
            const Icone = onglet.icon;
            return (
              <Link
                key={onglet.href}
                href={onglet.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                  estActif
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icone className="size-4" />
                {onglet.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-destructive/60 via-destructive/20 to-transparent" />
      </header>
      <main className="flex-1 overflow-y-auto bg-fixed bg-cover bg-center p-4" style={{
        backgroundImage:
          "linear-gradient(color-mix(in oklab, var(--muted) 88%, transparent), color-mix(in oklab, var(--muted) 88%, transparent)), url(/lapin6.jpg)",
      }}>
        {children}
      </main>
    </div>
  );
}
