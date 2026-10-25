import type { Metadata, Viewport } from "next";
import { Allura, IBM_Plex_Sans_Arabic, Montserrat, Noto_Kufi_Arabic, Syncopate } from "next/font/google";
import { lang } from "next/root-params";
import { dirOf, locales } from "@/i18n/config";
import { getLocale, getMessages, getT } from "@/i18n/dictionaries";
import { ogLocaleFor } from "@/i18n/metadata";
import { I18nProvider } from "@/i18n/client";
import { site } from "@/content/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DemoBar } from "@/components/layout/DemoBar";
import "../globals.css";

const syncopate = Syncopate({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-syncopate", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
// Script face for typed e-signatures only; not preloaded, fetched when a signature is typed.
const allura = Allura({ subsets: ["latin"], weight: "400", variable: "--font-signature", display: "swap", preload: false });
// Arabic faces, used only under :lang(ar) (globals.css): Noto Kufi Arabic for headlines, IBM Plex
// Sans Arabic for body text. Not preloaded: the root layout serves both languages, so a preload
// here would send them to English visitors too. Arabic pages fetch them on first use (swap).
const kufi = Noto_Kufi_Arabic({ subsets: ["arabic"], weight: ["700"], variable: "--font-kufi", display: "swap", preload: false });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-plex-arabic", display: "swap", preload: false });

export async function generateStaticParams() {
  return locales.map((l) => ({ lang: l }));
}

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT("common"), getLocale()]);
  return {
    metadataBase: new URL(site.url),
    title: { default: t("meta.title"), template: `%s | ${site.brandName}` },
    description: t("meta.description"),
    robots: site.demo ? { index: false, follow: false } : undefined,
    openGraph: { type: "website", siteName: site.brandName, ...ogLocaleFor(locale), images: [{ url: "/brand/og-template.png", width: 1200, height: 630, alt: site.brandName }] },
  };
}

export const viewport: Viewport = {
  themeColor: "#2c5252",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await lang();
  const messages = await getMessages();
  const t = await getT("common");
  const fonts = [syncopate.variable, montserrat.variable, allura.variable, ...(locale === "ar" ? [kufi.variable, plexArabic.variable] : [])].join(" ");
  return (
    <html lang={locale} dir={dirOf(locale)} className={fonts}>
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
