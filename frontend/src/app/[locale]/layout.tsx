import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { type Locale, locales } from "@/i18n/config";
import enMessages from "@/i18n/messages/en.json";
import esMessages from "@/i18n/messages/es.json";

export const metadata: Metadata = {
  title: "Soy Conservacion",
  description: "Mapa interactivo de observaciones de biodiversidad",
  alternates: {
    languages: {
      es: "https://tudominio.com/es",
      en: "https://tudominio.com/en",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  // Validar que el locale es válido
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Seleccionar los mensajes según el locale
  const messages = locale === "en" ? enMessages : esMessages;

  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      timeZone="America/Bogota"
      now={new Date()}
    >
      <LocaleProvider locale={locale}>{children}</LocaleProvider>
    </NextIntlClientProvider>
  );
}
