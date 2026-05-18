/**
 * next-intl Configuration
 *
 * Este archivo se usa cuando se importan mensajes dinámicamente
 * para que next-intl sepa dónde encontrarlos.
 */

export const messages = {
  es: () => import("./src/i18n/messages/es.json").then((m) => m.default),
  en: () => import("./src/i18n/messages/en.json").then((m) => m.default),
} as const;

export type SupportedLocale = keyof typeof messages;
