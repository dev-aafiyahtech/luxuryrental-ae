import Link from "next/link";
import { getHref, getT } from "@/i18n/dictionaries";
import { brands, categories } from "@/content/brands";
import { site } from "@/content/site";
import { whatsappHref } from "@/lib/whatsapp";
import { Logo } from "@/components/brand/Logo";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { MobileMenu } from "./MobileMenu";

export async function Header() {
  const t = await getT("common");
  const href = await getHref();
  const nav = [
    { label: t("nav.fleet"), href: href("/cars") },
    { label: t("nav.chauffeur"), href: href("/chauffeur") },
    { label: t("nav.delivery"), href: href("/delivery") },
    { label: t("nav.pricing"), href: href("/pricing") },
    { label: t("nav.faq"), href: href("/faq") },
    { label: t("nav.contact"), href: href("/contact") },
  ];
  const groups = [
    { label: t("nav.brands"), links: brands.map((b) => ({ label: b.name, href: href(`/cars/${b.slug}`) })) },
    { label: t("nav.types"), links: categories.map((c) => ({ label: c.name, href: href(`/cars/type/${c.slug}`) })) },
  ];

  return (
    <header className="site-header sticky top-0 z-[var(--z-header)] bg-gradient-to-b from-bg/90 to-bg/0 pt-[env(safe-area-inset-top)]">
      <div className="container-site flex h-[var(--header-h)] items-center justify-between gap-4">
        <Link href={href("/")} className="inline-flex min-h-11 items-center no-underline" aria-label={`${site.brandName} home`}>
          <Logo />
        </Link>
        <nav aria-label={t("nav.label")} className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center px-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted no-underline transition-colors hover:text-fg">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={whatsappHref()} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-accent" aria-label={t("nav.whatsapp")} target="_blank" rel="noopener">
            <WhatsAppIcon />
          </a>
          <Link href={href("/cars")} className="btn btn-primary btn-sm hidden sm:inline-flex">
            {t("nav.reserve")}
          </Link>
          <MobileMenu nav={nav} groups={groups} labels={{ menu: t("nav.menu"), close: t("nav.close"), reserve: t("nav.reserve") }} reserveHref={href("/cars")} />
        </div>
      </div>
    </header>
  );
}
