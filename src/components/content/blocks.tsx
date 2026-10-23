import clsx from "clsx";
import type { ReactNode } from "react";
import { Gift } from "lucide-react";
import type { Offer } from "@/content/types";
import { offers } from "@/content/rules";
import { site } from "@/content/site";
import { whatsappHref } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { Eyebrow } from "@/components/ui";
import { shortDate } from "@/content/pages/shared";

// Building blocks shared by the content pages. Server Components, no client JS.

/** Section heading size, between .display-md (H1) and .display-sm (cards). */
export const h2Class = "font-display text-[clamp(1.25rem,0.95rem+1.3vw,2.1rem)] font-bold uppercase leading-[1.08] tracking-[0.02em] [text-wrap:balance]";
export const h3Class = "text-[15px] font-semibold uppercase tracking-[0.12em] text-fg";

/** Decorative light streaks behind page heroes (static; nothing moves). */
export function HeroBackdrop() {
  const streaks = [
    { y: 120, len: 520, o: 0.55, c: "gold" },
    { y: 168, len: 760, o: 0.35, c: "ice" },
    { y: 210, len: 420, o: 0.6, c: "gold" },
    { y: 262, len: 900, o: 0.25, c: "gold" },
    { y: 300, len: 340, o: 0.45, c: "ice" },
    { y: 352, len: 640, o: 0.3, c: "gold" },
    { y: 400, len: 480, o: 0.5, c: "gold" },
    { y: 446, len: 820, o: 0.2, c: "ice" },
    { y: 494, len: 300, o: 0.4, c: "gold" },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 end-[-10%] h-[520px] w-[720px] rounded-full bg-[radial-gradient(closest-side,rgba(184,151,90,0.28),rgba(184,151,90,0.06)_60%,transparent)]" />
      <svg viewBox="0 0 1440 600" preserveAspectRatio="xMaxYMid slice" className="absolute inset-0 h-full w-full rtl:-scale-x-100 [mask-image:linear-gradient(90deg,transparent_15%,#000_70%)]">
        <defs>
          <linearGradient id="hb-gold" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#ebdab0" stopOpacity="0" />
            <stop offset="0.75" stopColor="#f6ebcf" />
            <stop offset="1" stopColor="#f8f0dc" />
          </linearGradient>
          <linearGradient id="hb-ice" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#a5d8dc" stopOpacity="0" />
            <stop offset="1" stopColor="#f4fbfb" />
          </linearGradient>
        </defs>
        <g transform="rotate(-9 1440 300)">
          {streaks.map((s, i) => (
            <line key={i} x1={1500 - s.len} y1={s.y} x2={1500} y2={s.y} stroke={`url(#hb-${s.c})`} strokeOpacity={s.o} strokeWidth={i % 3 === 0 ? 1.6 : 1} />
          ))}
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />
    </div>
  );
}

/** Page hero for content pages: eyebrow, H1, lede, actions and an optional aside (key facts). */
export function ContentHero({ eyebrow, num, title, lede, actions, aside, top }: { eyebrow: string; num?: string; title: string; lede?: ReactNode; actions?: ReactNode; aside?: ReactNode; top?: ReactNode }) {
  return (
    <header className="relative isolate overflow-hidden">
      <HeroBackdrop />
      <div className={clsx("container-site relative grid gap-10 pb-14 pt-10 md:pb-20 md:pt-16", aside && "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end lg:gap-16")}>
        <div className="grid min-w-0 content-start gap-6">
          {top}
          <Eyebrow num={num}>{eyebrow}</Eyebrow>
          <h1 className="display-md max-w-4xl">{title}</h1>
          {lede && <div className="lede grid gap-3">{lede}</div>}
          {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </header>
  );
}

/** A numbered page section with an eyebrow and H2. */
export function Section({ id, num, eyebrow, title, intro, children, className, aside }: { id: string; num?: string; eyebrow?: string; title: string; intro?: ReactNode; children?: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={clsx("scroll-mt-[calc(var(--header-h)+16px)] border-t border-line", className)}>
      <div className="container-site grid gap-10 py-16 md:py-24">
        <div className={clsx("grid gap-5", aside && "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16")}>
          <div className="grid gap-5">
            {eyebrow && <Eyebrow num={num}>{eyebrow}</Eyebrow>}
            <h2 id={`${id}-title`} className={h2Class}>{title}</h2>
            {intro && <div className="lede grid gap-3">{intro}</div>}
          </div>
          {aside}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Grid of key facts, e.g. for a hero aside. */
export function KeyFacts({ items, label, className }: { items: { label: string; value: ReactNode; note?: ReactNode }[]; label: string; className?: string }) {
  return (
    <dl aria-label={label} className={clsx("grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line [box-shadow:var(--shadow-edge)]", className)}>
      {items.map((item) => (
        <div key={item.label} className="grid content-start gap-2 bg-card p-5">
          <dt className="label">{item.label}</dt>
          <dd className="tabular text-lg font-semibold leading-tight text-fg md:text-xl">{item.value}</dd>
          {item.note && <dd className="text-[13px] leading-snug text-muted">{item.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Three-step "how it works". */
export function Steps({ steps, label }: { steps: { title: string; text: ReactNode }[]; label: string }) {
  return (
    <ol aria-label={label} className="grid gap-4 p-0 [list-style:none] md:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.title} className="card relative grid content-start gap-4 overflow-hidden p-6 md:p-8">
          <span aria-hidden="true" className="font-display text-[2.6rem] font-bold leading-none text-accent/90">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="text-lg font-semibold leading-snug">{step.title}</h3>
          <div className="text-[15px] leading-relaxed text-muted">{step.text}</div>
          <span aria-hidden="true" className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        </li>
      ))}
    </ol>
  );
}

/** WhatsApp link styled as a secondary button (glyph stays white, never gold). */
export function WhatsAppButton({ text, children, className, size }: { text?: string; children: ReactNode; className?: string; size?: "sm" }) {
  return (
    <a href={whatsappHref(text)} target="_blank" rel="noopener" className={clsx("btn btn-secondary", size === "sm" && "btn-sm", className)}>
      <WhatsAppIcon className="h-[18px] w-[18px] text-fg" />
      {children}
    </a>
  );
}

/** Closing call to action. */
export function CtaBand({ title, text, actions, id = "next" }: { title: string; text: ReactNode; actions: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={`${id}-title`} className="container-site pb-20 pt-4 md:pb-28">
      <div className="relative isolate overflow-hidden rounded-[var(--radius-panel)] border border-accent/30 bg-card p-7 [box-shadow:var(--shadow-edge)] md:p-14">
        <div aria-hidden="true" className="absolute -bottom-40 end-[-15%] -z-10 h-[420px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(235,218,176,0.22),transparent)]" />
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_auto] md:items-end md:gap-12">
          <div className="grid gap-4">
            <h2 id={`${id}-title`} className={h2Class}>{title}</h2>
            <div className="lede">{text}</div>
            <p className="fine">{site.replyPromise}</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">{actions}</div>
        </div>
      </div>
    </section>
  );
}

/** A launch offer, shown only while it is valid on `today`. */
export function OfferNotice({ id, today, className, children }: { id: Offer["id"]; today: string; className?: string; children?: ReactNode }) {
  const offer = offers.find((o) => o.id === id);
  if (!offer || today > offer.validUntil) return null;
  return (
    <aside aria-label={`${offer.name} offer`} className={clsx("relative isolate flex flex-wrap items-start gap-4 overflow-hidden rounded-[var(--radius-card)] border border-accent/40 bg-card p-5 md:flex-nowrap md:items-center md:p-6", className)}>
      <div aria-hidden="true" className="absolute inset-y-0 start-0 -z-10 w-1/2 bg-gradient-to-r from-accent/10 to-transparent rtl:bg-gradient-to-l" />
      <span className="grid h-11 w-11 flex-none place-items-center rounded-full border border-accent/50 text-accent-hover"><Gift className="h-5 w-5" aria-hidden="true" /></span>
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="badge">Launch offer</span>
          <strong className="font-semibold">{offer.name}</strong>
        </p>
        <p className="text-sm leading-relaxed text-champagne">{offer.summary} {children}</p>
      </div>
      <p className="fine w-full whitespace-nowrap ps-[60px] md:w-auto md:ps-0 md:text-end">Until {shortDate(offer.validUntil)}</p>
    </aside>
  );
}

/** "Last updated 23 Oct 2026" line for fact pages. */
export function LastUpdated({ iso, extra }: { iso: string; extra?: ReactNode }) {
  return (
    <p className="fine flex flex-wrap gap-x-3 gap-y-1">
      <span>Last updated <time dateTime={iso}>{shortDate(iso)}</time></span>
      {extra}
    </p>
  );
}

/** An HTML comment in the rendered page (for notes that must not show on screen). */
export function HtmlComment({ text }: { text: string }) {
  return <span hidden dangerouslySetInnerHTML={{ __html: `<!-- ${text.replace(/--/g, "–")} -->` }} />;
}
