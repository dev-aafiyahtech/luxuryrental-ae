import Link from "next/link";
import { getHref, getLocale, getT } from "@/i18n/dictionaries";
import { brands, categories } from "@/content/brands";
import { localizeCategory, siteFor } from "@/content/localize";
import { whatsappHref } from "@/lib/whatsapp";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitch } from "./LanguageSwitch";

export async function Footer() {
  const [t, href, locale] = await Promise.all([getT("common"), getHref(), getLocale()]);
  const site = siteFor(locale);
  const comma = locale === "ar" ? "، " : ", ";
  const cols = [
    { title: t("footer.fleet"), links: [...brands.map((b) => ({ label: b.name, href: `/cars/${b.slug}` })), ...categories.map((c) => ({ label: localizeCategory(c, locale).name, href: `/cars/type/${c.slug}` }))] },
    { title: t("footer.services"), links: [{ label: t("nav.chauffeur"), href: "/chauffeur" }, { label: t("nav.delivery"), href: "/delivery" }, { label: t("footer.airport"), href: "/delivery/dubai-airport-dxb" }, { label: t("nav.pricing"), href: "/pricing" }, { label: t("footer.requirements"), href: "/requirements" }] },
    { title: t("footer.company"), links: [{ label: t("footer.about"), href: "/about" }, { label: t("nav.faq"), href: "/faq" }, { label: t("nav.contact"), href: "/contact" }] },
    { title: t("footer.legal"), links: [{ label: t("footer.terms"), href: "/legal/terms-of-rental" }, { label: t("footer.cancellation"), href: "/legal/cancellation" }, { label: t("footer.privacy"), href: "/legal/privacy" }, { label: t("footer.cookies"), href: "/legal/cookies" }, { label: t("footer.termsOfUse"), href: "/legal/terms-of-use" }, { label: t("footer.accessibility"), href: "/legal/accessibility" }] },
  ];

  return (
    <footer className="relative z-[var(--z-content)] print:hidden border-t border-line bg-bg pb-[calc(48px+var(--dock-h)+env(safe-area-inset-bottom))] pt-14">
      <div className="container-site grid gap-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div className="grid content-start gap-4">
            <Link href={href("/")} className="no-underline"><Logo /></Link>
            <address className="not-italic text-sm leading-relaxed text-muted">
              {site.businessName}<br />
              {site.address.line1}{comma}{site.address.area}<br />
              {site.address.city}{comma}{site.address.country}<br />
              {site.hours}
            </address>
            <p className="text-sm text-muted">
              <a href={whatsappHref()} target="_blank" rel="noopener" className="text-fg">{t("footer.whatsapp")} <span dir="ltr">{site.whatsappDisplay}</span></a><br />
              <a href={`mailto:${site.email}`} dir="ltr">{site.email}</a>
            </p>
            <LanguageSwitch variant="footer" className="justify-self-start" />
          </div>
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title} className="grid content-start gap-3">
              <p className="label">{col.title}</p>
              <ul className="grid gap-2 p-0 text-sm [list-style:none]">
                {col.links.map((l) => (
                  <li key={l.href}><Link href={href(l.href)} className="text-muted no-underline hover:text-fg">{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="grid gap-2 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>{t("footer.vat")} {t("footer.images")}</p>
          <p>{t("footer.trademarks")}</p>
          <p>{t("footer.licence", { licence: site.tradeLicence, rta: site.rtaPermit, trn: site.vatTrn })}</p>
          <p>{t("footer.rights", { name: site.legalName })}</p>
          {site.sampleDetails && <p>{t("footer.sample")}</p>}
        </div>
      </div>
    </footer>
  );
}
