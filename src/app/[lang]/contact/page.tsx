import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { site } from "@/content/site";
import { rules } from "@/content/rules";
import { getHref } from "@/i18n/dictionaries";
import { whatsappHref } from "@/lib/whatsapp";
import { ContentHero, Section } from "@/components/content/blocks";
import { ContactForm } from "@/components/content/ContactForm";
import { DeliveryMap } from "@/components/content/DeliveryMap";
import { JsonLd, absoluteUrl, breadcrumbLd, businessRef, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

export async function generateMetadata() {
  return pageMetadata({
    title: "Contact Us: WhatsApp, Phone and Office in Dubai",
    description: `Message ${site.businessName} on WhatsApp at ${site.whatsappDisplay}. ${site.replyPromise} Office in Dubai Silicon Oasis.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const href = await getHref();
  const tel = `tel:${site.phone.replace(/\s/g, "")}`;
  const contactLd = { "@type": "ContactPage", name: `Contact ${site.businessName}`, url: absoluteUrl(href("/contact")), about: businessRef };
  const channels = [
    { icon: Phone, label: "Phone", value: site.phone, href: tel, note: site.hours },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}`, note: "For documents, invoices and anything long" },
    { icon: MapPin, label: "Office", value: `${site.address.line1}, ${site.address.area}`, note: `${site.address.city}, ${site.address.country}. Visits by appointment.` },
    { icon: Clock, label: "Hours", value: site.hours, note: `Car handovers ${rules.handoverHours.from}–${rules.handoverHours.to}` },
  ];

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: "Home", path: href("/") }, { name: "Contact" }]), contactLd)} />

      <ContentHero
        eyebrow="Contact"
        num="01"
        title={`Contact ${site.businessName}`}
        lede={<p>WhatsApp is the fastest way to reach us. {site.replyPromise}</p>}
      />

      <div className="border-t border-line">
        <div className="container-site grid gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="grid content-start gap-6">
            <a
              href={whatsappHref(`Hello ${site.businessName}, `)}
              target="_blank"
              rel="noopener"
              className="group relative isolate grid gap-5 overflow-hidden rounded-[var(--radius-panel)] border border-accent/40 bg-card p-7 no-underline transition-[border-color,box-shadow] duration-200 [box-shadow:var(--shadow-edge)] hover:border-accent hover:[box-shadow:var(--shadow-glow)] md:p-9"
            >
              <span aria-hidden="true" className="absolute -end-24 -top-24 -z-10 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(235,218,176,0.25),transparent)]" />
              <span className="grid h-14 w-14 place-items-center rounded-full border border-line bg-elevated">
                <WhatsAppIcon className="h-7 w-7 text-fg" />
              </span>
              <span className="grid gap-2">
                <span className="label">WhatsApp, fastest</span>
                <span className="tabular font-display text-[clamp(1.25rem,1rem+1.4vw,2rem)] font-bold tracking-[0.04em] text-fg" dir="ltr">{site.whatsappDisplay}</span>
                <span className="text-[15px] leading-relaxed text-champagne">Send the car and the dates you have in mind. We reply with availability and the price.</span>
              </span>
              <span className="btn btn-primary justify-self-start">Message us on WhatsApp</span>
            </a>

            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line p-0 [list-style:none] sm:grid-cols-2">
              {channels.map((c) => {
                const Icon = c.icon;
                const body = (
                  <>
                    <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                    <span className="label">{c.label}</span>
                    <span className="break-words font-semibold text-fg" dir={c.label === "Phone" ? "ltr" : undefined}>{c.value}</span>
                    <span className="text-[13px] leading-snug text-muted">{c.note}</span>
                  </>
                );
                return (
                  <li key={c.label} className="bg-card">
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

      <Section id="visit" num="02" eyebrow="Visit" title="Our office in Dubai Silicon Oasis">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center">
          <div className="grid content-start gap-5">
            <address className="not-italic text-lg leading-relaxed">
              {site.businessName}<br />
              {site.address.line1}<br />
              {site.address.area}, {site.address.city}<br />
              {site.address.country}
            </address>
            <p className="text-[15px] leading-relaxed text-champagne">
              You can collect and return cars here at no charge, by appointment. See{" "}
              <Link href={href("/delivery/dubai-silicon-oasis")} className="text-fg">collection in Dubai Silicon Oasis</Link>.
            </p>
            <p className="fine">Map pin and directions follow once the address is confirmed.</p>
          </div>
          <DeliveryMap id="contact-map" focus="dso" />
        </div>
      </Section>

      <Section id="complaints" num="03" eyebrow="Complaints" title="If something went wrong">
        <div className="grid max-w-[68ch] gap-4 text-[16px] leading-relaxed text-champagne">
          <p>
            Send us your booking reference and what happened, on WhatsApp or by email to{" "}
            <a href={`mailto:${site.email}`} className="text-fg">{site.email}</a>. We reply within {rules.complaintReplyWorkingDays} working days.
          </p>
          <p>
            If you are not satisfied with our answer, you can contact{" "}
            <a href={site.consumerProtection.url} target="_blank" rel="noopener" className="text-fg">{site.consumerProtection.name}</a>{" "}
            on {site.consumerProtection.phone}. This does not limit your rights under UAE consumer protection law.
          </p>
        </div>
      </Section>
    </>
  );
}
