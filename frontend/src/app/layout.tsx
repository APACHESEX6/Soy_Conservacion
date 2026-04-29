import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Soy Conservacion",
  description: "Mapa interactivo de observaciones de biodiversidad",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={poppins.variable}>
      <head>
        {/*
          preconnect: el browser abre la conexión TCP+TLS con los servidores de
          Mapbox mientras carga el HTML, eliminando 200-600ms de latencia antes
          del primer tile. Crítico para reducir los "cortes" al hacer zoom.

          api.mapbox.com  → token validation, style JSON, sprite, glyphs
          events.mapbox.com → telemetría (no bloquea tiles pero evita delay)
          *.tiles.mapbox.com → los 4 subdominios de tiles raster/vector
        */}
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
        <link rel="dns-prefetch" href="https://a.tiles.mapbox.com" />
        <link rel="dns-prefetch" href="https://b.tiles.mapbox.com" />
        <link rel="dns-prefetch" href="https://c.tiles.mapbox.com" />
        <link rel="dns-prefetch" href="https://d.tiles.mapbox.com" />
      </head>
      <body suppressHydrationWarning className="h-screen w-screen overflow-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
