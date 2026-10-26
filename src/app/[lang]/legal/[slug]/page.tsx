import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getHref, getLocale } from "@/i18n/dictionaries";
import * as legalEn from "@/content/pages/legal";
import * as legalAr from "@/content/pages/ar/legal";
import type { LegalBlock } from "@/content/pages/legal";
import { plain } from "@/content/pages/shared";
import { Rich } from "@/components/content/Rich";
import { JsonLd, absoluteUrl, breadcrumbLd, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { Breadcrumbs } from "@/components/ui";

// Long-form legal template (workstream 06: H1, version, "Last updated", table of contents,
// 70ch column at 17px, no dock, no scene).
// English and Arabic documents share slugs and section ids; the locale picks the module.

const legalFor = (locale: string) => (locale === "ar" ? legalAr : legalEn);

export async function generateStaticParams() {
  return legalEn.legalDocs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/legal/[slug]">) {
  const doc = legalFor(await getLocale()).getLegalDoc((await params).slug);
  if (!doc) return {};
  return pageMetadata({ title: doc.meta.title, description: doc.meta.description, path: `/legal/${doc.slug}` });
}

// `params` is read inside <Suspense> so the route shell stays instant (Next 16 validation).
export default function LegalPage({ params }: PageProps<"/[lang]/legal/[slug]">) {
  return (
    <Suspense fallback={<div className="container-site min-h-[80vh] pt-16" aria-busy="true" />}>
      <LegalContent params={params} />
    </Suspense>
  );
}

function Block({ block, href }: { block: LegalBlock; href: (p: string) => string }) {
  if (typeof block === "string") return <p><Rich text={block} href={href} /></p>;
  if ("list" in block) {
    const List = block.ordered ? "ol" : "ul";
    return (
      <List className={block.ordered ? "list-decimal" : "list-disc marker:text-accent"}>
        {block.list.map((item) => <li key={item} className="mb-2 ps-1"><Rich text={item} href={href} /></li>)}
      </List>
    );
  }
  const { caption, head, rows } = block.table;
  return (
    <div role="region" aria-label={caption} tabIndex={0} className="mb-6 overflow-x-auto rounded-[var(--radius-card)] border border-line">
      <table className="tabular w-full min-w-[32rem] border-collapse text-[15px] leading-snug">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => <th key={h} scope="col" className="border-b border-line bg-card px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-b-0">
              {row.map((cell, j) => {
                const Cell = j === 0 ? "th" : "td";
                return <Cell key={j} scope={j === 0 ? "row" : undefined} className={`px-4 py-3 text-start align-top ${j === 0 ? "font-semibold text-fg" : "text-champagne"}`}>{cell}</Cell>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function LegalContent({ params }: { params: PageProps<"/[lang]/legal/[slug]">["params"] }) {
  const [{ slug }, href, locale] = await Promise.all([params, getHref(), getLocale()]);
  const { getLegalDoc, legalDocs, legalUi: ui } = legalFor(locale);
  const doc = getLegalDoc(slug);
  if (!doc) notFound();
  const crumbs = [{ label: ui.home, href: href("/") }, { label: ui.legal }, { label: doc.title }];
  const pageLd = {
    "@type": "WebPage",
    name: doc.title,
    url: absoluteUrl(href(`/legal/${doc.slug}`)),
    dateModified: doc.updated,
    version: doc.version,
    description: plain(doc.summary),
    ...(ui.inLanguage ? { inLanguage: ui.inLanguage } : {}),
  };

  const toc = (
    <ol className="grid gap-1 p-0 [counter-reset:toc] [list-style:none]">
      {doc.sections.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="flex min-h-10 items-baseline gap-3 rounded-lg px-2 py-2 text-[14px] leading-snug text-muted no-underline transition-colors hover:bg-card hover:text-fg">
            <span className="tabular w-5 flex-none text-[12px] text-accent">{i + 1}</span>
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: ui.home, path: href("/") }, { name: doc.title }]), pageLd)} />
      <article className="container-site pb-24 pt-10 md:pt-14">
        <header className="grid max-w-[70ch] gap-5 pb-8">
          <Breadcrumbs items={crumbs} />
          <h1 className="display-md">{doc.title}</h1>
          <p className="fine flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            <span>{ui.version(doc.version)}</span>
            <span>{ui.updated} <time dateTime={doc.updated}>{ui.date(doc.updated)}</time></span>
          </p>
          <p className="text-[17px] leading-relaxed text-champagne">{doc.summary}</p>
        </header>

        <div className="grid gap-10 border-t border-line pt-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label={ui.contents} className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:max-h-[calc(100vh-var(--header-h)-48px)] lg:self-start lg:overflow-y-auto">
            <details className="group rounded-[var(--radius-card)] border border-line bg-card lg:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[13px] font-semibold uppercase tracking-[0.14em] [&::-webkit-details-marker]:hidden">
                {ui.contents}
                <ChevronDown className="h-4 w-4 text-accent transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="border-t border-line p-2">{toc}</div>
            </details>
            <div className="hidden lg:block">
              <p className="label mb-3 px-2">{ui.contents}</p>
              {toc}
            </div>
          </nav>

          <div className="prose-legal min-w-0 [&_a]:font-medium [&_a]:text-accent-hover">
            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-[calc(var(--header-h)+24px)]">
                <h2 id={`${s.id}-h`}><span className="tabular me-3 text-accent">{i + 1}.</span>{s.title}</h2>
                {s.blocks.map((b, j) => <Block key={j} block={b} href={href} />)}
              </section>
            ))}

            <nav aria-label={ui.otherPages} className="mt-14 grid gap-3 border-t border-line pt-8 font-[inherit] text-[15px]">
              <p className="label">{ui.otherPages}</p>
              <ul className="!m-0 grid gap-x-6 gap-y-2 !p-0 [list-style:none] sm:grid-cols-2">
                {legalDocs.filter((d) => d.slug !== doc.slug).map((d) => (
                  <li key={d.slug}><Link href={href(`/legal/${d.slug}`)} className="no-underline hover:underline">{d.title}</Link></li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </article>
    </>
  );
}
