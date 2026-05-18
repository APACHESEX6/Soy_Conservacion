export type Locale = "es" | "en";

export const locales: Locale[] = ["es", "en"];
export const defaultLocale: Locale = "es";

export const localeConfig = {
  es: {
    name: "Español",
    flag: "🇲🇽",
    native: "Español",
  },
  en: {
    name: "English",
    flag: "🇺🇸",
    native: "English",
  },
} as const;
