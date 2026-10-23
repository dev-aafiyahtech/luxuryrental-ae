import type { Metadata, Viewport } from "next";
import { Montserrat, Syncopate } from "next/font/google";
import { lang } from "next/root-params";
import { dirOf, locales } from "@/i18n/config";
import { getMessages, getT } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/client";
import { site } from "@/content/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DemoBar } from "@/components/layout/DemoBar";
import "../globals.css";

const syncopate = Syncopate({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-syncopate", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });

export async function generateStaticParams() {
  return locales.map((l) => ({ lang: l }));
}

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Luxury Car Rental in Dubai, Delivered | LuxuryRental.ae", template: "%s | LuxuryRental.ae" },
  description: "16 cars from Ferrari, Lamborghini, Rolls-Royce, Bugatti and more, delivered across Dubai including DXB. Request online, confirm on WhatsApp.",
  robots: site.demo ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await lang();
  const messages = await getMessages();
  const t = await getT("common");
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${syncopate.variable} ${montserrat.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:text-on-accent">
          {t("nav.skip")}
        </a>
        <I18nProvider locale={locale} messages={messages}>
          <DemoBar />
          <Header />
          <main id="main" tabIndex={-1} className="relative z-[var(--z-content)] outline-none">
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
