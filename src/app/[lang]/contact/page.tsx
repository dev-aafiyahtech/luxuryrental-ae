import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { site } from "@/content/site";
import { siteFor } from "@/content/localize";
import { getHref, getLocale } from "@/i18n/dictionaries";
import { whatsappHref } from "@/lib/whatsapp";
import { contactPage as contactEn } from "@/content/pages/contact";
import { contactPage as contactAr } from "@/content/pages/ar/contact";
import { ContentHero, Section } from "@/components/content/blocks";
import { ContactForm } from "@/components/content/ContactForm";
import { DeliveryMap } from "@/components/content/DeliveryMap";
import { Rich } from "@/components/content/Rich";
import { JsonLd, absoluteUrl, breadcrumbLd, businessRef, graph, langLd } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { contentUiFor } from "@/content/pages/ui";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

const pageFor = (locale: string) => (locale === "ar" ? contactAr : contactEn);

export async function generateMetadata() {
  const P = pageFor(await getLocale());
  return pageMetadata({ title: P.meta.title, description: P.meta.description(), path: "/contact" });
}

export default async function ContactPage() {
  const [href, locale] = await Promise.all([getHref(), getLocale()]);
  const P = pageFor(locale);
  const U = contentUiFor(locale);
  const s = siteFor(locale);
  const tel = `tel:${site.phone.replace(/\s/g, "")}`;
  const contactLd = { "@type": "ContactPage", name: P.ldName, url: absoluteUrl(href("/contact")), about: businessRef, ...langLd(locale) };
  const channels = [
    { key: "phone", icon: Phone, label: P.channels.phone, value: site.phone, href: tel, note: s.hours },
    { key: "email", icon: Mail, label: P.channels.email, value: site.email, href: `mailto:${site.email}`, note: P.channels.emailNote },
    { key: "office", icon: MapPin, label: P.channels.office, value: P.channels.officeValue(), note: P.channels.officeNote() },
    { key: "hours", icon: Clock, label: P.channels.hours, value: s.hours, note: P.channels.hoursNote },
  ];

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: U.home, path: href("/") }, { name: P.crumb }]), contactLd)} />

      <ContentHero eyebrow={P.eyebrow} num="01" title={P.title} lede={<p>{P.lede()}</p>} />

      <div className="border-t border-line">
        <div className="container-site grid gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="grid content-start gap-6">
            <a
              href={whatsappHref(P.whatsapp.prefill)}
              target="_blank"
              rel="noopener"
              className="group relative isolate grid gap-5 overflow-hidden rounded-[var(--radius-panel)] border border-accent/40 bg-card p-7 no-underline transition-[border-color,box-shadow] duration-200 [box-shadow:var(--shadow-edge)] hover:border-accent hover:[box-shadow:var(--shadow-glow)] md:p-9"
            >
              <span aria-hidden="true" className="absolute -end-24 -top-24 -z-10 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(235,218,176,0.25),transparent)]" />
              <span className="grid h-14 w-14 place-items-center rounded-full border border-line bg-elevated">
                <WhatsAppIcon className="h-7 w-7 text-fg" />
              </span>
              <span className="grid gap-2">
                <span className="label">{P.whatsapp.label}</span>
                <span className="tabular font-display text-[clamp(1.25rem,1rem+1.4vw,2rem)] font-bold tracking-[0.04em] text-fg justify-self-start" dir="ltr">{site.whatsappDisplay}</span>
                <span className="text-[15px] leading-relaxed text-champagne">{P.whatsapp.text}</span>
              </span>
              <span className="btn btn-primary justify-self-start">{P.whatsapp.button}</span>
            </a>

            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line p-0 [list-style:none] sm:grid-cols-2">
              {channels.map((c) => {
                const Icon = c.icon;
                const body = (
                  <>
                    <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                    <span className="label">{c.label}</span>
                    <span className="break-words font-semibold text-fg justify-self-start" dir={c.key === "phone" ? "ltr" : undefined}>{c.value}</span>
                    <span className="text-[13px] leading-snug text-muted">{c.note}</span>
                  </>
                );
                return (
                  <li key={c.key} className="bg-card">
                    {c.href ? (
                      <a href={c.href} className="grid h-full content-start gap-2 p-5 no-underline transition-colors hover:bg-elevated">{body}</a>
                    ) : (
                      <div className="grid h-full content-start gap-2 p-5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <ContactForm />
        </div>
      </div>

      <Section id="visit" num="02" eyebrow={P.visit.eyebrow} title={P.visit.title}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center">
          <div className="grid content-start gap-5">
            <address className="not-italic text-lg leading-relaxed">
              {P.visit.address().map((line, i, all) => (
                <span key={line}>{line}{i < all.length - 1 && <br />}</span>
              ))}
            </address>
            <p className="text-[15px] leading-relaxed text-champagne">
              <Rich text={P.visit.text} href={href} linkClassName="text-fg" />
            </p>
            <p className="fine">{P.visit.note}</p>
          </div>
          <DeliveryMap id="contact-map" focus="dso" />
        </div>
      </Section>

      <Section id="complaints" num="03" eyebrow={P.complaints.eyebrow} title={P.complaints.title}>
        <div className="grid max-w-[68ch] gap-4 text-[16px] leading-relaxed text-champagne">
          {P.complaints.paras().map((p) => (
            <p key={p}><Rich text={p} href={href} linkClassName="text-fg" /></p>
          ))}
        </div>
      </Section>
    </>
  );
}
