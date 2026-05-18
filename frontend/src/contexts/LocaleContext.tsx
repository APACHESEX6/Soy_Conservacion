"use client";

import type React from "react";
import { createContext, useContext } from "react";
import type { Locale } from "@/i18n/config";

interface LocaleContextType {
  locale: Locale;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  return <LocaleContext.Provider value={{ locale }}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext(): Locale | undefined {
  const context = useContext(LocaleContext);
  if (!context) {
    return undefined;
  }
  return context.locale;
}
