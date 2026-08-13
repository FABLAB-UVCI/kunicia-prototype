"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Rabbit,
  Dna,
  DoorClosed,
  Heart,
  Baby,
  Scale,
  TrendingUp,
  BarChart3,
  Wheat,
  UserRound,
  ShoppingCart,
  Syringe,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const GROUPES_NAV = [
  {
    titre: null,
    liens: [{ href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    titre: "Élevage",
    liens: [
      { href: "/lapins", label: "Lapins", icon: Rabbit },
      { href: "/races", label: "Races", icon: Dna },
      { href: "/cages", label: "Clapiers", icon: DoorClosed },
      { href: "/accouplements", label: "Accouplements", icon: Heart },
      { href: "/portees", label: "Reproductions", icon: Baby },
      { href: "/pesees", label: "Pesées", icon: Scale },
      { href: "/sante", label: "Santé", icon: Syringe },
    ],
  },
  {
    titre: "Analyse",
    liens: [
      { href: "/predictions", label: "Prédictions", icon: TrendingUp },
      { href: "/stats", label: "Statistiques", icon: BarChart3 },
    ],
  },
  {
    titre: "Ressources",
    liens: [{ href: "/alimentation", label: "Alimentation", icon: Wheat }],
  },
  {
    titre: "Commercial",
    liens: [
      { href: "/clients", label: "Clients", icon: UserRound },
      { href: "/ventes", label: "Ventes", icon: ShoppingCart },
      { href: "/finance", label: "Finance", icon: Wallet },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { estConnecte, chargementInitial, utilisateur, deconnexion } = useAuth();

  useEffect(() => {
    if (!chargementInitial && !estConnecte) {
      // on mémorise la page demandée pour y revenir après connexion : sans
      // ça, arriver ici en scannant le QR d'une cage (session expirée) fait
      // perdre la destination et renvoie systématiquement sur le tableau de
      // bord, ce qui casse tout l'intérêt du scan
      const destination = pathname ?? "/dashboard";
      const suffixe =
        destination === "/dashboard"
          ? ""
          : `?suivant=${encodeURIComponent(destination)}`;
      router.replace(`/connexion${suffixe}`);
    }
  }, [chargementInitial, estConnecte, pathname, router]);

  // tant qu'on ne sait pas encore si l'utilisateur est connecté (requête
  // /auth/me en cours), ou qu'on sait qu'il ne l'est pas (redirection en
  // cours via l'effet ci-dessus), on n'affiche rien plutôt que de montrer le
  // tableau de bord puis de le remplacer brutalement par l'écran de connexion
  if (chargementInitial || !estConnecte) {
    return null;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="relative flex items-center justify-between gap-4 border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Rabbit className="size-4.5" />
          </span>
          <span className="font-medium">{utilisateur?.nomFerme}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={deconnexion}>
            Déconnexion
          </Button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <nav className="flex gap-1 overflow-x-auto border-b bg-card px-2 py-2 md:w-56 md:flex-col md:gap-0 md:overflow-y-auto md:border-r md:border-b-0 md:px-3 md:py-4">
          {GROUPES_NAV.map((groupe, index) => (
            <div key={groupe.titre ?? "racine"} className={index > 0 ? "md:mt-4" : ""}>
              {groupe.titre && (
                <p className="hidden px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground/70 uppercase md:block">
                  {groupe.titre}
                </p>
              )}
              <div className="flex gap-1 md:flex-col">
                {groupe.liens.map((lien) => {
                  const estActif =
                    pathname === lien.href || pathname?.startsWith(`${lien.href}/`);
                  const Icone = lien.icon;
                  return (
                    <Link
                      key={lien.href}
                      href={lien.href}
                      className={`flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                        estActif
                          ? "border-primary bg-accent font-medium text-accent-foreground"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icone className={`size-4 shrink-0 ${estActif ? "text-primary" : ""}`} />
                      {lien.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {utilisateur?.role === "ADMIN" && (
            <div className="md:mt-4">
              <p className="hidden px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground/70 uppercase md:block">
                Plateforme
              </p>
              <div className="flex gap-1 md:flex-col">
                <Link
                  href="/admin"
                  className={`flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                    pathname === "/admin" || pathname?.startsWith("/admin/")
                      ? "border-primary bg-accent font-medium text-accent-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <ShieldCheck className="size-4 shrink-0" />
                  Administration
                </Link>
              </div>
            </div>
          )}
        </nav>
        <main
          className="flex-1 overflow-y-auto bg-fixed bg-cover bg-center p-4"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklab, var(--muted) 88%, transparent), color-mix(in oklab, var(--muted) 88%, transparent)), url(/lapin6.jpg)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
