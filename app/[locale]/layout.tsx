import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { inter, plusJakartaSans, cairo } from "@/styles/fonts";
import { ToastProvider } from "@/components/ui/toast-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "EpiFlow | JobPost X-Ray — Autonomous Recruitment Intelligence",
  description:
    "EpiFlow autonomous workflow platform: Turn any LinkedIn job post into actionable recruitment intelligence and a ready-to-send email draft in seconds.",
  icons: {
    icon: "/epiflow-favicon.svg",
    apple: "/epiflow-favicon.svg",
  },
};

interface RootLocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLocaleLayout({
  children,
  params,
}: RootLocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "ar" | "en")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const isRtl = locale === "ar";
  const fontClass = isRtl
    ? cairo.variable
    : `${inter.variable} ${plusJakartaSans.variable}`;

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} className={fontClass}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
