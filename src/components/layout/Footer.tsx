import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, BadgeCheck, CarFront, ReceiptText, ShieldCheck, Star, type LucideIcon } from "lucide-react";
import { getHref, getLocale, getT } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { brands, categories } from "@/content/brands";
import { localizeCategory, siteFor } from "@/content/localize";
import { paymentMarks, reviewMarks, type Mark } from "@/content/footer-marks";
import { shownReview } from "@/content/reviews";
import type { ReviewPlatform, ReviewProfile } from "@/content/site";
import { whatsappHref } from "@/lib/whatsapp";
import { Logo } from "@/components/brand/Logo";
import { BrandLogo } from "@/components/car/BrandLogo";
import { LanguageSwitch } from "./LanguageSwitch";

type T = Awaited<ReturnType<typeof getT<"common">>>;

// Footer: marques, site links, then a quiet trust band (reviews, licences, payment marks) and the
// legal lines. The background runs from the page's Sea Moss at the top to Sea Moss at night
// (`bg-deep`) at the bottom, so it continues the section above without a seam. Every text colour
// passes WCAG AA on both ends (muted text: 5.3:1 at the top, 10.0:1 at the bottom).

const platforms: ReviewPlatform[] = ["google", "trustpilot"];
const link = "inline-flex min-h-11 items-center text-muted no-underline transition-colors duration-200 hover:text-fg";

export async function Footer() {
  const [t, href, locale] = await Promise.all([getT("common"), getHref(), getLocale()]);
  const site = siteFor(locale);
  const comma = locale === "ar" ? "، " : ", ";
  // Real profiles always show; the illustrative preview figures only on preview deployments and in dev.
  const env = { NODE_ENV: process.env.NODE_ENV, VERCEL_ENV: process.env.VERCEL_ENV };
  const reviews = platforms.flatMap((p) => {
    const profile = shownReview(p, env);
    return profile ? [{ platform: p, profile }] : [];
  });
  const cols = [
    { title: t("footer.fleet"), links: [{ label: t("footer.allCars"), href: "/cars" }, ...categories.map((c) => ({ label: localizeCategory(c, locale).name, href: `/cars/type/${c.slug}` }))] },
    { title: t("footer.services"), links: [{ label: t("nav.chauffeur"), href: "/chauffeur" }, { label: t("nav.delivery"), href: "/delivery" }, { label: t("footer.airport"), href: "/delivery/dubai-airport-dxb" }, { label: t("nav.pricing"), href: "/pricing" }, { label: t("footer.requirements"), href: "/requirements" }] },
    { title: t("footer.company"), links: [{ label: t("footer.about"), href: "/about" }, { label: t("nav.faq"), href: "/faq" }, { label: t("nav.contact"), href: "/contact" }, { label: t("footer.team"), href: "/ops" }] },
    { title: t("footer.legal"), links: [{ label: t("footer.terms"), href: "/legal/terms-of-rental" }, { label: t("footer.cancellation"), href: "/legal/cancellation" }, { label: t("footer.privacy"), href: "/legal/privacy" }, { label: t("footer.cookies"), href: "/legal/cookies" }, { label: t("footer.termsOfUse"), href: "/legal/terms-of-use" }, { label: t("footer.accessibility"), href: "/legal/accessibility" }] },
  ];
  // Claims backed by site.ts (licence, permit, TRN) and rules.ts (every tier carries an excess, i.e.
  // comprehensive insurance is included; see the Terms of Rental). No authority logos: they imply endorsement.
  const credentials: { icon: LucideIcon; title: string; detail: ReactNode }[] = [
    { icon: BadgeCheck, title: t("footer.det"), detail: <>{t("footer.detNumber")} <Num>{site.tradeLicence}</Num></> },
    { icon: CarFront, title: t("footer.rta"), detail: <>{t("footer.rtaNumber")} <Num>{site.rtaPermit}</Num></> },
    { icon: ReceiptText, title: t("footer.vatRegistered"), detail: <>{t("footer.trn")} <Num>{site.vatTrn}</Num></> },
    { icon: ShieldCheck, title: t("footer.insurance"), detail: t("footer.insuranceNote") },
  ];

  return (
    <footer className="relative z-[var(--z-content)] print:hidden bg-linear-to-b from-bg from-[12%] to-bg-deep pb-[calc(48px+var(--dock-h)+env(safe-area-inset-bottom))] pt-12 lg:pt-16">
      <div className="container-site grid gap-14 lg:gap-16">
        {/* Marques: the eight makers in the fleet, each linking to its brand page. */}
        <nav aria-labelledby="footer-marques" className="grid justify-items-center gap-5">
          <p id="footer-marques" className="label flex items-center gap-4 text-center before:h-px before:w-8 before:flex-none before:bg-accent/40 after:h-px after:w-8 after:flex-none after:bg-accent/40 sm:before:w-12 sm:after:w-12">
            {t("footer.marques")}
          </p>
          <ul className="grid w-full max-w-3xl grid-cols-2 justify-items-center gap-x-4 gap-y-2 p-0 [list-style:none] sm:grid-cols-4 sm:gap-y-4">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link href={href(`/cars/${b.slug}`)} className="inline-flex min-h-11 items-center px-2 py-2 text-muted no-underline transition-colors duration-200 hover:text-fg">
                  <Marque slug={b.slug} name={b.name} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Hairline />

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.25fr_repeat(4,1fr)] lg:gap-x-8">
          <div className="col-span-2 grid content-start gap-4 lg:col-span-1">
            <Link href={href("/")} className="inline-flex min-h-11 items-center justify-self-start no-underline"><Logo /></Link>
            <address className="not-italic text-sm leading-relaxed text-muted">
              {site.businessName}<br />
              {site.address.line1}{comma}{site.address.area}<br />
              {site.address.city}{comma}{site.address.country}<br />
              {site.hours}
            </address>
            <div className="grid justify-items-start text-sm">
              <a href={whatsappHref()} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1.5 text-fg no-underline transition-colors duration-200 hover:text-accent">
                {t("footer.whatsapp")} <span dir="ltr">{site.whatsappDisplay}</span>
              </a>
              <a href={`mailto:${site.email}`} dir="ltr" className={link}>{site.email}</a>
              <LanguageSwitch variant="footer" />
            </div>
          </div>
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title} className="grid content-start gap-2">
              <p className="label">{col.title}</p>
              <ul className="grid p-0 text-sm [list-style:none]">
                {col.links.map((l) => (
                  <li key={l.href}><Link href={href(l.href)} className={`${link} py-1 leading-snug`}>{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Trust band: one row per group, label at the start, hairlines between rows. */}
        <div className="grid">
          <Hairline />
          {reviews.length > 0 && (
            <TrustRow id="footer-reviews" label={t("footer.reviews")}>
              <ul aria-labelledby="footer-reviews" className="grid gap-3 p-0 [list-style:none] sm:grid-cols-2 xl:grid-cols-[repeat(2,minmax(0,22rem))]">
                {reviews.map(({ platform, profile }) => (
                  <li key={platform}><ReviewBadge mark={reviewMarks[platform]} profile={profile} t={t} locale={locale} /></li>
                ))}
              </ul>
            </TrustRow>
          )}
          <TrustRow id="footer-credentials" label={t("footer.credentials")}>
            <ul aria-labelledby="footer-credentials" className="grid gap-x-8 gap-y-5 p-0 [list-style:none] sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,max-content))] xl:justify-between">
              {credentials.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="grid size-10 flex-none place-items-center rounded-full border border-accent/30 text-accent">
                    <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="grid gap-0.5 pt-0.5">
                    <span className="text-sm font-medium leading-snug text-balance text-fg">{title}</span>
                    <span className="text-xs leading-relaxed text-muted">{detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </TrustRow>
          <TrustRow id="footer-payments" label={t("footer.payments")}>
            <ul aria-labelledby="footer-payments" className="flex flex-wrap gap-2 p-0 [list-style:none]">
              {site.paymentMethods.map((id) => (
                <li key={id} className="grid h-10 w-14 place-items-center rounded-lg border border-line/60 text-fg sm:h-11 sm:w-[4.5rem]">
                  <MarkSvg mark={paymentMarks[id]} label={paymentMarks[id].name} />
                </li>
              ))}
            </ul>
          </TrustRow>
        </div>

        <div className="grid gap-2 border-t border-line/50 pt-6 text-xs leading-relaxed text-muted">
          <p>{t("footer.vat")} {t("footer.images")}</p>
          <p>{t("footer.trademarks")}</p>
          <p>{t("footer.rights", { name: site.legalName.replace(/\.$/, "") })}</p>
        </div>
      </div>
    </footer>
  );
}

/** A gold hairline that fades out at both ends. */
function Hairline() {
  return <div aria-hidden="true" className="h-px bg-linear-to-r from-transparent via-accent/35 to-transparent" />;
}

function TrustRow({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 border-b border-line/40 py-7 last:border-b-0 lg:grid-cols-[14rem_1fr] lg:items-center lg:gap-8">
      <p id={id} className="label text-balance">{label}</p>
      {children}
    </div>
  );
}

/**
 * One marque in the strip: the maker's mark (monochrome, decorative) above its name. The name is
 * always shown as text and is the link's accessible label (brands.ts rule).
 */
function Marque({ slug, name }: { slug: string; name: string }) {
  return (
    <span className="grid justify-items-center gap-2.5">
      <BrandLogo slug={slug} className="h-7 w-auto sm:h-8" />
      <span lang="en" className="font-display text-[10px] font-bold uppercase tracking-[0.2em] sm:text-[11px]">{name}</span>
    </span>
  );
}

/** A number or code inside translated text, kept left to right. */
function Num({ children }: { children: ReactNode }) {
  return <bdi dir="ltr" className="tabular">{children}</bdi>;
}

/** A Simple Icons mark in currentColor. With a label it is an image; without, decoration. */
function MarkSvg({ mark, label, size, className }: { mark: Mark; label?: string; size?: number; className?: string }) {
  const [, , w, h] = mark.viewBox.split(" ").map(Number);
  const height = size ?? mark.height ?? 20;
  return (
    <svg viewBox={mark.viewBox} width={Math.round((height * w) / h * 10) / 10} height={height} fill="currentColor" className={className} focusable="false" {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      <path d={mark.path} />
    </svg>
  );
}

/** Five stars, filled in Antique Gold up to the rating (from the start side, so right to left in Arabic). */
function Stars({ rating }: { rating: number }) {
  const row = (tone: string) => (
    <span className={`flex w-max gap-0.5 ${tone}`}>
      {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 flex-none" fill="currentColor" strokeWidth={0} />)}
    </span>
  );
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span aria-hidden="true" className="relative inline-flex">
      {row("text-line")}
      <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${pct}%` }}>{row("text-accent")}</span>
    </span>
  );
}

/** "127 reviews" with the number isolated, by CLDR plural category (Arabic has six forms). */
function reviewCount(t: T, locale: Locale, count: number): ReactNode {
  const key = `footer.reviewCount.${new Intl.PluralRules(locale).select(count)}`;
  const template = t(key) === key ? t("footer.reviewCount.other") : t(key);
  const [before, after = ""] = template.split("{n}");
  if (!template.includes("{n}")) return template;
  return <>{before}<Num>{new Intl.NumberFormat("en-US").format(count)}</Num>{after}</>;
}

/** A review platform badge: mark, name, stars, rating and count, linking to the profile in a new tab. */
function ReviewBadge({ mark, profile, t, locale }: { mark: Mark; profile: ReviewProfile; t: T; locale: Locale }) {
  return (
    <a href={profile.url} target="_blank" rel="noopener noreferrer" className="group flex min-h-16 items-center gap-4 rounded-card border border-line/70 px-4 py-3 no-underline transition-colors duration-200 hover:border-accent/60">
      <MarkSvg mark={mark} size={22} className="flex-none text-fg" />
      <span className="grid min-w-0 gap-1">
        <span className="text-sm font-semibold text-fg"><bdi dir="ltr">{mark.name}</bdi></span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <Stars rating={profile.rating} />
          <span className="text-sm font-semibold text-fg"><Num>{profile.rating.toFixed(1)}</Num><span className="sr-only"> {t("footer.outOf")}</span></span>
          <span aria-hidden="true">·</span>
          <span>{reviewCount(t, locale, profile.count)}</span>
        </span>
      </span>
      <ArrowUpRight className="ms-auto size-4 flex-none text-muted transition-colors duration-200 group-hover:text-accent rtl:-scale-x-100" aria-hidden="true" />
      <span className="sr-only">{t("footer.newTab")}</span>
    </a>
  );
}
