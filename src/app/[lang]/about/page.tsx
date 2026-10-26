import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle } from "lucide-react";
import { brands } from "@/content/brands";
import { carsByBrand } from "@/content/cars";
import { site } from "@/content/site";
import { getHref, getLocale } from "@/i18n/dictionaries";
import { aboutPage as aboutEn } from "@/content/pages/about";
import { aboutPage as aboutAr } from "@/content/pages/ar/about";
import { contentUiFor } from "@/content/pages/ui";
import { ContentHero, CtaBand, Section, WhatsAppButton, h3Class } from "@/components/content/blocks";
import { DeliveryMap } from "@/components/content/DeliveryMap";
import { JsonLd, absoluteUrl, breadcrumbLd, businessRef, graph, langLd } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";

const pageFor = (locale: string) => (locale === "ar" ? aboutAr : aboutEn);

export async function generateMetadata() {
  const P = pageFor(await getLocale());
  return pageMetadata({ title: P.meta.title, description: P.meta.description, path: "/about" });
}

const pillarIcons = [BadgeCheck, MessageCircle, MapPin];

export default async function AboutPage() {
  const [href, locale] = await Promise.all([getHref(), getLocale()]);
  const P = pageFor(locale);
  const U = contentUiFor(locale);
  const aboutLd = { "@type": "AboutPage", name: P.hero.title, url: absoluteUrl(href("/about")), about: businessRef, ...langLd(locale) };

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: U.home, path: href("/") }, { name: P.ui.crumb }]), aboutLd)} />

      <ContentHero
        eyebrow={P.hero.eyebrow}
        num="01"
        title={P.hero.title}
        lede={<p>{P.hero.lede}</p>}
        actions={
          <>
            <ButtonLink href={href("/cars")}>{U.browseFleet}</ButtonLink>
            <WhatsAppButton text={P.ui.whatsappText}>{P.ui.messageUs}</WhatsAppButton>
          </>
        }
      />

      <Section id="story" num="02" eyebrow={P.ui.storyEyebrow} title={P.storyTitle}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
          <div className="grid max-w-[68ch] gap-5 text-[17px] leading-[1.75] text-champagne">
            {P.story.map((p, i) => (
              <p key={i} className={i === 0 ? "text-fg" : undefined}>{p}</p>
            ))}
          </div>
          <aside className="grid content-start gap-4">
            <div className="card grid gap-4 p-6">
              <p className="label">{P.ui.fleetByBrand}</p>
              <ul className="grid gap-2 p-0 [list-style:none]">
                {brands.map((b) => (
                  <li key={b.slug}>
                    <Link href={href(`/cars/${b.slug}`)} className="flex min-h-11 items-center justify-between gap-4 border-b border-line text-[15px] no-underline transition-colors hover:text-accent-hover">
                      <span>{b.name}</span>
                      <span className="text-[13px] text-muted" dir="ltr">{carsByBrand(b.slug).map((c) => c.model.replace(/ Series II.*$/, "")).join(", ")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      <Section id="how-we-work" num="03" eyebrow={P.ui.howEyebrow} title={P.ui.howTitle}>
        <ul className="grid gap-4 p-0 [list-style:none] md:grid-cols-3">
          {P.pillars.map((p, i) => {
            const Icon = pillarIcons[i];
            return (
              <li key={p.title} className="card grid content-start gap-4 p-6 md:p-8">
                <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
                <h3 className="text-lg font-semibold leading-snug">{p.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{p.text()}</p>
              </li>
            );
          })}
        </ul>
        <ul className="trust">
          {P.ui.trust.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </Section>

      <Section id="company" num="04" eyebrow={P.ui.companyEyebrow} title={P.ui.companyTitle}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
          <div className="card grid content-start gap-5 p-6 md:p-8">
            <h3 className={h3Class}>{site.businessName}</h3>
            <dl className="spec-list">
              {P.company().map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <DeliveryMap id="about-map" focus="dso" />
        </div>
      </Section>

      <CtaBand
        title={P.ui.ctaTitle}
        text={<p>{P.cta}</p>}
        actions={
          <>
            <ButtonLink href={href("/contact")} variant="secondary">{P.ui.contactUs}</ButtonLink>
            <ButtonLink href={href("/cars")}>{U.browseFleet}</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
