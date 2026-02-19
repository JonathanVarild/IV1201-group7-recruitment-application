import type { Metadata } from "next";
import "./globals.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Footer } from "@/components/Footer";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
import { getAuthenticatedUserData } from "@/lib/session";
import { InvalidSessionError } from "@/lib/errors/authErrors";

export const metadata: Metadata = {
  title: "Recruitment Application",
  description: "Here you can apply for a job at the amusement park.",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  let authenticatedUserData = null;
  try {
    authenticatedUserData = await getAuthenticatedUserData();
  } catch (error) {
    if (!(error instanceof InvalidSessionError)) {
      console.error(error);
    }
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale}>
          <AuthProvider loggedInUser={authenticatedUserData}>
            <Header />
            {children}
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
