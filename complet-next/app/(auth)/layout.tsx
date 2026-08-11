import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-4">
      <Image
        src="/lapins.jpeg"
        alt="Élevage de lapins"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-3 text-center text-white">
          <h1 className="text-2xl font-semibold sm:text-3xl">Kunicia</h1>
          <p className="mt-1 text-sm text-white/90">
            Le pilotage intelligent de votre élevage, du sevrage à la vente.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
