/**
 * Configuración de next-intl para App Router
 *
 * IMPORTANTE: Este archivo DEBE estar en i18n.ts en la raíz
 * y debe exportar getRequestConfig por defecto
 */

import { getRequestConfig } from "next-intl/server";
import { type Locale, locales } from "./src/i18n/config";

export default getRequestConfig(async ({ requestLocale }) => {
  // Este callback se ejecuta en el servidor
  // y proporciona el locale y los mensajes al provider

  let locale = await requestLocale;

  // Validar el locale
  if (!locale || !locales.includes(locale as Locale)) {
    locale = "es";
  }

  return {
    locale,
    messages: (await import(`./src/i18n/messages/${locale}.json`)).default,
  };
});
