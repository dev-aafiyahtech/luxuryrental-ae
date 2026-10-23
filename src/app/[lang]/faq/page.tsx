import Link from "next/link";
import { site } from "@/content/site";
import { getHref } from "@/i18n/dictionaries";
import { allFaqs, faqCount, faqGroups } from "@/content/pages/faq";
import { ContentHero, CtaBand, WhatsAppButton, h2Class } from "@/components/content/blocks";
import { FaqList } from "@/components/content/Faq";
import { JsonLd, breadcrumbLd, faqLd, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";
import { plain } from "@/content/pages/shared";

export async function generateMetadata() {
  const first = plain(allFaqs[0].a).replace(/\n+/g, " ");
  const description = first.length > 155 ? `${first.slice(0, first.lastIndexOf(" ", 150))}…` : first;
  return pageMetadata({ title: "Luxury Car Rental FAQ", description, path: "/faq" });
}

export default async function FaqPage() {
  const href = await getHref();
  const chip = "inline-flex min-h-11 flex-none items-center rounded-full border border-line px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted no-underline transition-colors hover:border-accent hover:text-fg";

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: "Home", path: href("/") }, { name: "FAQ" }]), faqLd(allFaqs))} />

      <ContentHero
        eyebrow={`FAQ · ${faqCount} answers`}
        num="01"
        title="How does renting with us work?"
        lede={
          <>
            <p>Answers on booking, requirements, the deposit, insurance, delivery, chauffeur service and cancellation.</p>
            <p>
              Every figure here matches our <Link href={href("/pricing")} className="text-fg">pricing</Link> and{" "}
              <Link href={href("/requirements")} className="text-fg">rental requirements</Link> pages.
            </p>
          </>
        }
        actions={<WhatsAppButton text={`Hello ${site.businessName}, I have a question.`}>Ask on WhatsApp</WhatsAppButton>}
      />

      <div className="border-t border-line">
        <div className="container-site grid gap-10 pb-20 pt-8 md:pt-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 lg:pt-16">
          <nav aria-label="FAQ topics" className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
            <p className="label mb-4 hidden lg:block">Topics</p>
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [list-style:none] [scrollbar-width:none] lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0">
              {faqGroups.map((g, i) => (
                <li key={g.id} className="flex-none">
                  <a href={`#${g.id}`} className={`${chip} lg:w-full lg:justify-between lg:rounded-xl lg:border-transparent lg:px-3 lg:hover:border-line`}>
                    <span><span aria-hidden="true" className="me-2 font-display text-[11px] text-accent">{String(i + 1).padStart(2, "0")}</span>{g.title}</span>
                    <span className="ms-3 hidden tabular text-muted lg:inline">{g.items.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="grid min-w-0 gap-16">
            {faqGroups.map((g, i) => (
              <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="grid scroll-mt-[calc(var(--header-h)+24px)] gap-6">
                <p className="eyebrow"><span className="num">{String(i + 1).padStart(2, "0")}</span>{g.items.length} questions</p>
                <h2 id={`${g.id}-title`} className={h2Class}>{g.title}</h2>
                <FaqList items={g.items} href={href} />
              </section>
            ))}
          </div>
        </div>
      </div>

      <CtaBand
        title="Still have a question?"
        text={<p>Message us on WhatsApp with the car and the dates you have in mind, and we answer with the facts for your trip.</p>}
        actions={
          <>
            <WhatsAppButton text={`Hello ${site.businessName}, I have a question.`}>Message us on WhatsApp</WhatsAppButton>
            <ButtonLink href={href("/cars")}>Browse the fleet</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
