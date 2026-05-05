"use client";

import dynamic from "next/dynamic";

// Mapbox GL pesa ~280KB gzip. El dynamic import con ssr:false evita que se
// intente renderizar en el servidor (WebGL no existe en Node.js).
// El fallback muestra el fondo del mapa mientras el bundle se descarga,
// eliminando el flash de pantalla en blanco.
const MapView = dynamic(
  () => import("../../components/map/MapView").then((module) => module.MapView),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-slate-100" aria-hidden="true" />,
  },
);

export function MapViewNoSSR({ isUIHidden = false }: { isUIHidden?: boolean }) {
  return <MapView isUIHidden={isUIHidden} />;
}
