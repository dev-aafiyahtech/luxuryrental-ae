import { getHref, getLocale } from "@/i18n/dictionaries";
import { faqFor } from "@/content/pages/faq";
import { contentUiFor } from "@/content/pages/ui";
import { ContentHero, CtaBand, WhatsAppButton, h2Class } from "@/components/content/blocks";
import { FaqList } from "@/components/content/Faq";
import { Rich } from "@/components/content/Rich";
import { JsonLd, breadcrumbLd, faqLd, graph, langLd } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";
import { plain } from "@/content/pages/shared";

export async function generateMetadata() {
  const { allFaqs, faqPage } = faqFor(await getLocale());
  const first = plain(allFaqs[0].a).replace(/\n+/g, " ");
  const description = first.length > 155 ? `${first.slice(0, first.lastIndexOf(" ", 150))}…` : first;
  return pageMetadata({ title: faqPage.metaTitle, description, path: "/faq" });
}

export default async function FaqPage() {
  const [href, locale] = await Promise.all([getHref(), getLocale()]);
  const { allFaqs, faqCount, faqGroups, faqPage: P } = faqFor(locale);
  const U = contentUiFor(locale);
  const chip = "inline-flex min-h-11 flex-none items-center rounded-full border border-line px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted no-underline transition-colors hover:border-accent hover:text-fg";

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: U.home, path: href("/") }, { name: P.crumb }]), faqLd(allFaqs, langLd(locale).inLanguage))} />

      <ContentHero
        eyebrow={P.eyebrow(faqCount)}
        num="01"
        title={P.title}
        lede={<>{P.lede.map((p) => <p key={p}><Rich text={p} href={href} linkClassName="text-fg" /></p>)}</>}
        actions={<WhatsAppButton text={P.whatsappText}>{U.askWhatsApp}</WhatsAppButton>}
      />

      <div className="border-t border-line">
        <div className="container-site grid gap-10 pb-20 pt-8 md:pt-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 lg:pt-16">
          <nav aria-label={P.topicsLabel} className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
            <p className="label mb-4 hidden lg:block">{P.topics}</p>
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
                <p className="eyebrow"><span className="num">{String(i + 1).padStart(2, "0")}</span>{P.groupCount(g.items.length)}</p>
                <h2 id={`${g.id}-title`} className={h2Class}>{g.title}</h2>
                <FaqList items={g.items} href={href} />
              </section>
            ))}
          </div>
        </div>
      </div>

      <CtaBand
        title={P.ctaTitle}
        text={<p>{P.ctaText}</p>}
        actions={
          <>
            <WhatsAppButton text={P.whatsappText}>{U.messageWhatsApp}</WhatsAppButton>
            <ButtonLink href={href("/cars")}>{U.browseFleet}</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
