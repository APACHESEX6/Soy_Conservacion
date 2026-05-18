/**
 * next-intl configuration
 * Este archivo es leído automáticamente por next-intl
 */

import enMessages from "@/i18n/messages/en.json";
import esMessages from "@/i18n/messages/es.json";

export const messages = {
  es: esMessages,
  en: enMessages,
} as const;

export type Messages = typeof messages;

type AppMessages = typeof esMessages;

declare global {
  // Para type-safety en useTranslations()
  interface IntlMessages extends AppMessages {}
}
