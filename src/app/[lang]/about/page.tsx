import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle } from "lucide-react";
import { brands } from "@/content/brands";
import { carsByBrand } from "@/content/cars";
import { site } from "@/content/site";
import { getHref } from "@/i18n/dictionaries";
import { aboutPage as P } from "@/content/pages/about";
import { ContentHero, CtaBand, Section, WhatsAppButton, h3Class } from "@/components/content/blocks";
import { DeliveryMap } from "@/components/content/DeliveryMap";
import { JsonLd, absoluteUrl, breadcrumbLd, businessRef, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { ButtonLink, Notice } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";

export async function generateMetadata() {
  return pageMetadata({ title: P.meta.title, description: P.meta.description, path: "/about" });
}

const pillarIcons = [BadgeCheck, MessageCircle, MapPin];

export default async function AboutPage() {
  const href = await getHref();
  const aboutLd = { "@type": "AboutPage", name: P.hero.title, url: absoluteUrl(href("/about")), about: businessRef };

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: "Home", path: href("/") }, { name: "About" }]), aboutLd)} />

      <ContentHero
        eyebrow={P.hero.eyebrow}
        num="01"
        title={P.hero.title}
        lede={<p>{P.hero.lede}</p>}
        actions={
          <>
            <ButtonLink href={href("/cars")}>Browse the fleet</ButtonLink>
            <WhatsAppButton text={`Hello ${site.businessName}.`}>Message us</WhatsAppButton>
          </>
        }
      />

      <Section id="story" num="02" eyebrow="Our story" title={P.storyTitle}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
          <div className="grid max-w-[68ch] gap-5 text-[17px] leading-[1.75] text-champagne">
            {P.story.map((p, i) => (
              <p key={i} className={i === 0 ? "text-fg" : undefined}>{p}</p>
            ))}
          </div>
          <aside className="grid content-start gap-4">
            <Notice tone="info" title="Demo copy">
              This story is a placeholder until {site.businessName} sends its own. Text in [brackets] is for the client to fill in.
            </Notice>
            <div className="card grid gap-4 p-6">
              <p className="label">The fleet by brand</p>
              <ul className="grid gap-2 p-0 [list-style:none]">
                {brands.map((b) => (
                  <li key={b.slug}>
                    <Link href={href(`/cars/${b.slug}`)} className="flex min-h-11 items-center justify-between gap-4 border-b border-line text-[15px] no-underline transition-colors hover:text-accent-hover">
                      <span>{b.name}</span>
                      <span className="text-[13px] text-muted">{carsByBrand(b.slug).map((c) => c.model.replace(/ Series II.*$/, "")).join(", ")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      <Section id="how-we-work" num="03" eyebrow="How we work" title="Three things we hold ourselves to">
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
          <li>Prices include {site.vatRate}% VAT</li>
          <li>Based in Dubai Silicon Oasis</li>
          <li>Comprehensive insurance included</li>
          <li>Requests confirmed on WhatsApp</li>
        </ul>
      </Section>

      <Section id="company" num="04" eyebrow="Company details" title="Who you are renting from">
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
            <p className="fine">Values in [brackets] are placeholders until the licence documents are confirmed.</p>
          </div>
          <DeliveryMap id="about-map" focus="dso" />
        </div>
      </Section>

      <CtaBand
        title="Find your car"
        text={<p>{P.cta}</p>}
        actions={
          <>
            <ButtonLink href={href("/contact")} variant="secondary">Contact us</ButtonLink>
            <ButtonLink href={href("/cars")}>Browse the fleet</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
