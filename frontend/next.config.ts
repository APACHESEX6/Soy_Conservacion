import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  // StrictMode desactivado: en desarrollo monta los componentes dos veces,
  // lo que crea dos instancias WebGL del mapa consumiendo el doble de GPU/CPU.
  // En producción no tiene efecto — el build siempre usa modo estricto.
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "mapbox-gl"],
    // optimizeCss: true,
  },
  // Solución para error de hidratación por extensiones de navegador
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  ...(process.env.NODE_ENV === "production" && {
    async headers() {
      return [
        {
          source: "/api/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "no-store",
            },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
