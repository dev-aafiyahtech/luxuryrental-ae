import Link from "next/link";
import { Fragment } from "react";
import { Check, X } from "lucide-react";
import { getHref, getLocale } from "@/i18n/dictionaries";
import { requirementsPage as requirementsEn } from "@/content/pages/requirements";
import { requirementsPage as requirementsAr } from "@/content/pages/ar/requirements";
import { factsUpdated } from "@/content/pages/shared";
import { ContentHero, CtaBand, KeyFacts, LastUpdated, Section, WhatsAppButton, h3Class } from "@/components/content/blocks";
import { FactTable, CellNote } from "@/components/content/FactTable";
import { FaqList } from "@/components/content/Faq";
import { JsonLd, breadcrumbLd, faqLd, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";

// Copy comes from content/pages/requirements.ts (English) or content/pages/ar/requirements.ts
// (Arabic), picked by locale; the rules behind it are the same.
const requirementsFor = (locale: string) => (locale === "ar" ? requirementsAr : requirementsEn);

export async function generateMetadata() {
  const P = requirementsFor(await getLocale());
  return pageMetadata({ title: P.meta.title, description: P.meta.description, path: "/requirements" });
}

/** The copy mini-markup (`**bold**`, `[label](/path)`) with this page's inline styles. */
function Inline({ text, href }: { text: string; href: (path: string) => string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((part, i) => {
        if (!part) return null;
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="text-fg">{part.slice(2, -2)}</strong>;
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
        if (link) return <Link key={i} href={href(link[2])} className="text-fg">{link[1]}</Link>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

function Rows({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid border-t border-line">
      {items.map((r) => (
        <div key={r.label} className="grid gap-1 border-b border-line py-4 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-8">
          <dt className="label pt-0.5">{r.label}</dt>
          <dd className="max-w-[68ch] text-[15px] leading-relaxed text-champagne">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function RequirementsPage() {
  const [href, locale] = await Promise.all([getHref(), getLocale()]);
  const P = requirementsFor(locale);
  const U = P.ui;
  const faqs = P.faqs();
  const faqNode = { ...faqLd(faqs), ...(U.inLanguage ? { inLanguage: U.inLanguage } : {}) };

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: U.crumbs.home, path: href("/") }, { name: U.crumbs.page }]), faqNode)} />

      <ContentHero
        eyebrow={`${P.hero.eyebrow} · ${U.updated(factsUpdated)}`}
        num="01"
        title={P.hero.title}
        lede={<>{P.hero.lede.map((p) => <p key={p}>{p}</p>)}</>}
        actions={
          <nav aria-label={U.jumpLabel} className="flex flex-wrap gap-2">
            {U.jump.map((j) => (
              <a key={j.id} href={`#${j.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted no-underline transition-colors hover:border-accent hover:text-fg">
                {j.label}
              </a>
            ))}
          </nav>
        }
        aside={<KeyFacts label={U.factsLabel} items={P.facts()} />}
      />

      <Section id="age" num="02" eyebrow={U.age.eyebrow} title={U.age.title}>
        <FactTable
          id="tier-table"
          caption={U.age.caption}
          captionHidden
          minWidth={960}
          columns={U.age.columns.map((label, i) => (i > 0 ? { label, align: "end" as const } : { label }))}
          rows={P.tierRows().map((r) => ({
            key: r.tier,
            cells: [
              <span key="t">{r.name}<CellNote>{U.age.carList(r.cars)}</CellNote></span>,
              U.age.minAge(r.minAge),
              U.age.years(r.licenceYears),
              r.notice,
              r.deposit,
              r.excess,
            ],
          }))}
        />
        <ul className="grid gap-3 p-0 [list-style:none] md:grid-cols-3">
          {P.tierNotes().map((note) => (
            <li key={note} className="card p-5 text-[15px] leading-relaxed text-champagne">{note}</li>
          ))}
        </ul>
      </Section>

      <Section id="licences" num="03" eyebrow={U.licences.eyebrow} title={U.licences.title} intro={<p>{P.licenceNote}</p>}>
        <ol className="grid gap-4 p-0 [list-style:none] sm:grid-cols-2 lg:grid-cols-4">
          {P.licences.map((l, i) => (
            <li key={l.title} className="card grid content-start gap-3 p-6">
              <span aria-hidden="true" className="font-display text-xl font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-[16px] font-semibold">{l.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{l.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="documents" num="04" eyebrow={U.documents.eyebrow} title={U.documents.title} intro={<p>{P.documents.note}</p>}>
        <div className="grid gap-4 md:grid-cols-2">
          {[{ title: U.documents.visitors, items: P.documents.visitors }, { title: U.documents.residents, items: P.documents.residents }].map((g) => (
            <div key={g.title} className="card grid content-start gap-4 p-6 md:p-8">
              <h3 className={h3Class}>{g.title}</h3>
              <ul className="grid gap-3 p-0 [list-style:none]">
                {g.items.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] text-champagne">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="deposit" num="05" eyebrow={U.deposit.eyebrow} title={U.deposit.title}>
        <Rows items={P.deposit()} />
        <div id="drivers" className="card grid gap-3 p-6 md:p-8">
          <h3 className={h3Class}>{U.deposit.drivers}</h3>
          <p className="max-w-[68ch] text-[15px] leading-relaxed text-champagne">{P.drivers}</p>
        </div>
      </Section>

      <Section id="notice" num="06" eyebrow={U.notice.eyebrow} title={U.notice.title} intro={<p>{P.noticeNote()}</p>}>
        <FactTable
          id="notice-table"
          caption={U.notice.caption}
          captionHidden
          mode="stack"
          columns={U.notice.columns.map((label, i) => (i > 0 ? { label, align: "end" as const } : { label }))}
          rows={P.noticeRows().map((r) => ({ key: r.key, cells: [r.what, r.notice, r.min] }))}
        />
      </Section>

      <Section id="insurance" num="07" eyebrow={U.insurance.eyebrow} title={U.insurance.title} intro={<p>{U.insurance.intro}</p>}>
        <FactTable
          id="insurance-table"
          caption={U.insurance.caption}
          captionHidden
          mode="stack"
          columns={U.insurance.columns.map((label, i) => (i === 0 ? { label } : i === 3 ? { label, short: U.insurance.withCoverShort, align: "end" as const } : { label, align: "end" as const }))}
          rows={P.insuranceRows().map((r) => ({ key: r.key, cells: [r.tier, r.excess, r.fullCover, r.withCover] }))}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card grid content-start gap-4 p-6 md:p-8">
            <h3 className={h3Class}>{U.insurance.exclusions}</h3>
            <ul className="grid gap-3 p-0 [list-style:none]">
              {P.exclusions.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] text-champagne">
                  <X className="mt-0.5 h-4 w-4 flex-none text-danger" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="card grid content-start gap-4 p-6 md:p-8">
            <h3 className={h3Class}>{U.insurance.accident}</h3>
            <p className="text-[15px] leading-relaxed text-champagne">{P.accident}</p>
          </div>
        </div>
      </Section>

      <Section id="on-the-road" num="08" eyebrow={U.road.eyebrow} title={U.road.title}>
        <Rows items={P.onTheRoad()} />
        <p className="text-sm text-muted"><Inline text={U.road.note} href={href} /></p>
      </Section>

      <Section id="chauffeur" num="09" eyebrow={U.chauffeur.eyebrow} title={U.chauffeur.title}>
        <ul className="grid gap-3 p-0 [list-style:none] md:grid-cols-2">
          {P.chauffeurRules().map((r) => (
            <li key={r} className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-card p-5 text-[15px] leading-relaxed text-champagne">
              <Check className="mt-1 h-4 w-4 flex-none text-accent" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted"><Inline text={U.chauffeur.note} href={href} /></p>
      </Section>

      <Section id="faq" num="10" eyebrow={U.faq.eyebrow} title={U.faq.title}>
        <FaqList items={faqs} href={href} />
        <LastUpdated iso={factsUpdated} extra={<span>{U.faq.summaryNote}</span>} />
      </Section>

      <CtaBand
        title={U.cta.title}
        text={<p>{U.cta.text}</p>}
        actions={
          <>
            <WhatsAppButton text={U.cta.whatsappText}>{U.cta.whatsapp}</WhatsAppButton>
            <ButtonLink href={href("/cars")}>{U.cta.fleet}</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
