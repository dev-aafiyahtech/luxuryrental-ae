import Link from "next/link";
import { Check, X } from "lucide-react";
import { site } from "@/content/site";
import { getHref } from "@/i18n/dictionaries";
import { requirementsPage as P } from "@/content/pages/requirements";
import { factsUpdated, monthStamp } from "@/content/pages/shared";
import { ContentHero, CtaBand, KeyFacts, LastUpdated, Section, WhatsAppButton, h3Class } from "@/components/content/blocks";
import { FactTable, CellNote } from "@/components/content/FactTable";
import { FaqList } from "@/components/content/Faq";
import { JsonLd, breadcrumbLd, faqLd, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";

export async function generateMetadata() {
  return pageMetadata({ title: P.meta.title, description: P.meta.description, path: "/requirements" });
}

const jump = [
  { id: "age", label: "Age and licence" },
  { id: "licences", label: "Licences and IDP" },
  { id: "documents", label: "Documents" },
  { id: "deposit", label: "Deposit" },
  { id: "notice", label: "Notice" },
  { id: "insurance", label: "Insurance" },
  { id: "on-the-road", label: "Fuel, tolls, fines" },
  { id: "chauffeur", label: "Chauffeur" },
];

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
  const href = await getHref();
  const faqs = P.faqs();

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: "Home", path: href("/") }, { name: "Rental requirements" }]), faqLd(faqs))} />

      <ContentHero
        eyebrow={`${P.hero.eyebrow} · Updated ${monthStamp(factsUpdated)}`}
        num="01"
        title={P.hero.title}
        lede={<>{P.hero.lede.map((p) => <p key={p}>{p}</p>)}</>}
        actions={
          <nav aria-label="On this page" className="flex flex-wrap gap-2">
            {jump.map((j) => (
              <a key={j.id} href={`#${j.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted no-underline transition-colors hover:border-accent hover:text-fg">
                {j.label}
              </a>
            ))}
          </nav>
        }
        aside={<KeyFacts label="Requirements at a glance" items={P.facts()} />}
      />

      <Section id="age" num="02" eyebrow="Age and licence" title="Age and licence rules by car">
        <FactTable
          id="tier-table"
          caption="Driver rules by car tier"
          captionHidden
          minWidth={960}
          columns={[
            { label: "Tier" },
            { label: "Minimum age", align: "end" },
            { label: "Licence held", align: "end" },
            { label: "Notice", align: "end" },
            { label: "Deposit", align: "end" },
            { label: "Excess", align: "end" },
          ]}
          rows={P.tierRows().map((r) => ({
            key: r.tier,
            cells: [
              <span key="t">{r.name}<CellNote>{r.cars.join(", ")}</CellNote></span>,
              `${r.minAge}+`,
              `${r.licenceYears} years`,
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

      <Section id="licences" num="03" eyebrow="Licences" title="Which licence you can drive on" intro={<p>{P.licenceNote}</p>}>
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

      <Section id="documents" num="04" eyebrow="Documents" title="What to bring to the handover" intro={<p>{P.documents.note}</p>}>
        <div className="grid gap-4 md:grid-cols-2">
          {[{ title: "Visitors", items: P.documents.visitors }, { title: "UAE residents", items: P.documents.residents }].map((g) => (
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

      <Section id="deposit" num="05" eyebrow="Credit card and deposit" title="The security deposit">
        <Rows items={P.deposit()} />
        <div id="drivers" className="card grid gap-3 p-6 md:p-8">
          <h3 className={h3Class}>Additional drivers</h3>
          <p className="max-w-[68ch] text-[15px] leading-relaxed text-champagne">{P.drivers}</p>
        </div>
      </Section>

      <Section id="notice" num="06" eyebrow="Notice and minimum rental" title="How far ahead to book" intro={<p>{P.noticeNote()}</p>}>
        <FactTable
          id="notice-table"
          caption="Notice and minimum rental"
          captionHidden
          mode="stack"
          columns={[{ label: "Booking" }, { label: "Notice", align: "end" }, { label: "Minimum", align: "end" }]}
          rows={P.noticeRows().map((r) => ({ key: r.key, cells: [r.what, r.notice, r.min] }))}
        />
      </Section>

      <Section id="insurance" num="07" eyebrow="Insurance and excess" title="Insurance, excess and Full Cover" intro={<p>Comprehensive insurance is included in every rental. For each damage claim you pay up to the excess. Full Cover lowers it and also covers tyres, rims and glass.</p>}>
        <FactTable
          id="insurance-table"
          caption="Excess and Full Cover by tier"
          captionHidden
          mode="stack"
          columns={[{ label: "Tier" }, { label: "Excess", align: "end" }, { label: "Full Cover", align: "end" }, { label: "Excess with Full Cover", short: "With Full Cover", align: "end" }]}
          rows={P.insuranceRows().map((r) => ({ key: r.key, cells: [r.tier, r.excess, r.fullCover, r.withCover] }))}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card grid content-start gap-4 p-6 md:p-8">
            <h3 className={h3Class}>The insurance does not cover</h3>
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
            <h3 className={h3Class}>If there is an accident</h3>
            <p className="text-[15px] leading-relaxed text-champagne">{P.accident}</p>
          </div>
        </div>
      </Section>

      <Section id="on-the-road" num="08" eyebrow="During the rental" title="Fuel, kilometres, tolls and fines">
        <Rows items={P.onTheRoad()} />
        <p className="text-sm text-muted">Every fee is listed on our <Link href={href("/pricing#fees")} className="text-fg">pricing page</Link>.</p>
      </Section>

      <Section id="chauffeur" num="09" eyebrow="Chauffeur service" title="Chauffeur bookings">
        <ul className="grid gap-3 p-0 [list-style:none] md:grid-cols-2">
          {P.chauffeurRules().map((r) => (
            <li key={r} className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-card p-5 text-[15px] leading-relaxed text-champagne">
              <Check className="mt-1 h-4 w-4 flex-none text-accent" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">Rates and cars are on the <Link href={href("/chauffeur")} className="text-fg">chauffeur page</Link>.</p>
      </Section>

      <Section id="faq" num="10" eyebrow="Questions" title="Requirements questions">
        <FaqList items={faqs} href={href} />
        <LastUpdated iso={factsUpdated} extra={<span>These rules are a summary. The rental agreement you sign at handover has the full terms.</span>} />
      </Section>

      <CtaBand
        title="Not sure about your licence?"
        text={<p>Tell us where your licence was issued and which car you want. We check it on WhatsApp before you send a request.</p>}
        actions={
          <>
            <WhatsAppButton text={`Hello ${site.businessName}, can I rent with my licence? It was issued in: `}>Check on WhatsApp</WhatsAppButton>
            <ButtonLink href={href("/cars")}>Browse the fleet</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
