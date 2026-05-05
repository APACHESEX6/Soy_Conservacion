"use client";

import { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

export function HydrationFix({ children }: Props) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Evita renderizado hasta que esté hidratado
  if (!isHydrated) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <>{children}</>;
}
