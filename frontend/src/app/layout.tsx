import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Soy Conservacion",
  description: "Mapa con Mapbox",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="h-screen w-screen overflow-hidden font-sans">
       
        {children}
      </body>
    </html>
  );
}