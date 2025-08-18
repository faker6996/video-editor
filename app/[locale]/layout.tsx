import type { Metadata } from "next";
// Use system fonts to avoid network font fetch during build
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AppProviders } from "@/components/providers/AppProviders";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

// Note: We rely on system fonts via globals.css. CSS variables will fall back gracefully.

export const metadata: Metadata = {
  title: "Adoria",
  description: "",
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  
  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`antialiased`} suppressHydrationWarning>
        <AppProviders>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="min-h-screen bg-background" role="main" aria-label="Main content">
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </div>
          </NextIntlClientProvider>
        </AppProviders>
      </body>
    </html>
  );
}
