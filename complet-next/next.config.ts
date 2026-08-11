import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // build autonome (server.js + seulement les node_modules nécessaires) —
  // pour une image Docker qui ne copie pas tout node_modules, cf. deploiement/
  output: "standalone",
  // Next.js bloque par défaut les requêtes du serveur de dev venant d'une
  // origine autre que localhost — nécessaire pour tester via un tunnel
  // ngrok (utile notamment pour le scan QR, qui a besoin d'HTTPS pour la
  // caméra sur un autre appareil que cette machine)
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.ngrok.io"],
};

export default nextConfig;
