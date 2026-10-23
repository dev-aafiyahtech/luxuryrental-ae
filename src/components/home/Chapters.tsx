import Link from "next/link";
import type { Car } from "@/content/types";
import { carPath, carsInCategory, chauffeurCars } from "@/content/cars";
import { getBrand } from "@/content/brands";
import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { getHref, getT } from "@/i18n/dictionaries";
import { lowestFrom } from "@/lib/pricing";
import { formatAED } from "@/lib/format";
import { callouts } from "@/components/car/CarBits";
import { Eyebrow } from "@/components/ui";
import { SculptureTabs } from "./SculptureTabs";
import { CheckAvailability, ReserveSlot } from "./Islands";

// The four chapters of the homepage scroll story, rendered on the server so every word is
// in the HTML before any script runs. Layout follows the approved prototype: two sticky
// chapters (Skyline, Sculpture) and two scrolling ones (Velocity Tunnel, Reserve). With
// reduced motion (or no JavaScript) the sticky frames become ordinary blocks and every
// chapter shows its final, readable state.

/** Horizontal padding shared by the chapters; the end side leaves room for the chapter rail. */
const padX = "ps-4 pe-4 sm:ps-6 sm:pe-6 lg:ps-[max(24px,4vw)] lg:pe-[150px]";

export async function HomeChapters({ top, today }: { top: Car[]; today: string }) {
  const [t, href] = await Promise.all([getT("home"), getHref()]);
  const [first, ...rest] = t("sky.title").split(" ");

  const cards = [
    { key: "supercars", href: href("/cars/type/supercars"), price: lowestFrom(carsInCategory("supercars").filter((c) => !c.rates.onRequest), today), unit: t("tunnel.perDay") },
    { key: "suvs", href: href("/cars/type/suvs"), price: lowestFrom(carsInCategory("suvs").filter((c) => !c.rates.onRequest), today), unit: t("tunnel.perDay") },
    { key: "chauffeur", href: href("/chauffeur"), price: Math.min(...chauffeurCars().map((c) => c.chauffeur!.hourly)), unit: t("tunnel.perHour"), note: t("tunnel.minHours", { hours: rules.chauffeur.minHours }) },
  ];

  const tabs = top.map((car) => ({ brand: getBrand(car.brand)?.name ?? "", model: car.model }));
  const panels = top.map((car) => {
    const [power, perf, cabin, wheels] = callouts(car);
    const rows = [
      { label: t("sculpture.powertrain"), value: `${power.title} · ${power.detail}` },
      { label: t("sculpture.performance"), value: `${perf.title} · ${perf.detail}` },
      { label: t("sculpture.cabin"), value: `${cabin.title} · ${cabin.detail}` },
      { label: t("sculpture.drive"), value: `${wheels.title} · ${wheels.detail}` },
    ];
    return (
      <div key={car.slug} className="grid gap-4 max-md:gap-3">
        <p className="text-sm leading-relaxed text-champagne max-md:hidden">
          <span className="font-semibold text-fg">{car.name}.</span> {car.tagline}
        </p>
        <dl className="spec-list lg:group-data-[stage=gl]/home:sr-only max-md:grid-cols-2 max-md:gap-x-3.5 max-md:rounded-xl max-md:border-t-0 max-md:bg-[rgba(12,10,9,.6)] max-md:px-3.5 max-md:py-1.5 max-md:[&>div]:grid max-md:[&>div]:content-start max-md:[&>div]:justify-start max-md:[&>div]:gap-[3px] max-md:[&>div]:border-b-0 max-md:[&>div]:py-2 max-md:[&_dd]:text-start max-md:[&_dd]:text-[13px]">
          {rows.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="fine">{t("sculpture.schematic")}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="btn btn-primary" href={href(carPath(car))}>
            {t("sculpture.see")}
          </Link>
        </div>
      </div>
    );
  });

  return (
    <>
      {/* 01 Skyline: the camera descends through the night city onto the helipad */}
      <section id="skyline" aria-labelledby="h-sky" className="relative z-[2] h-[290vh] motion-reduce:h-auto">
        <div
          data-frame=""
          className={`${padX} sticky top-0 grid h-[calc(100svh-var(--home-top,0px))] items-end overflow-hidden pt-[120px] pb-[calc(var(--home-dock)+56px)] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(0deg,var(--shade)_20%,transparent_70%)] md:before:bg-[linear-gradient(90deg,var(--shade),transparent_58%)] md:rtl:before:bg-[linear-gradient(270deg,var(--shade),transparent_58%)] motion-reduce:relative motion-reduce:h-auto motion-reduce:min-h-svh motion-reduce:gap-8`}
        >
          <div data-sky-a="" className="shadowed relative grid max-w-[780px] gap-[22px] [grid-area:1/1] motion-reduce:[grid-area:auto]">
            <Eyebrow num="01">{t("sky.eyebrow")}</Eyebrow>
            <h1 id="h-sky" tabIndex={-1} className="display outline-none">
              {first}
              <br />
              {rest.join(" ")}
            </h1>
            <p className="lede max-w-[52ch]">{t("sky.lede")}</p>
            <div className="flex flex-wrap gap-3">
              <CheckAvailability label={t("sky.check")} fallbackHref={href("/cars")} />
              <a className="btn btn-secondary" href="#fleet">
                {t("sky.skip")}
              </a>
            </div>
          </div>
          <div
            data-sky-b=""
            className="shadowed relative grid max-w-[400px] gap-3 justify-self-stretch border-s border-accent bg-[linear-gradient(90deg,rgba(12,10,9,.84),rgba(12,10,9,.6))] p-6 backdrop-blur-[6px] [grid-area:1/1] md:justify-self-end rtl:bg-[linear-gradient(270deg,rgba(12,10,9,.84),rgba(12,10,9,.6))] motion-safe:invisible motion-safe:opacity-0 motion-reduce:justify-self-start motion-reduce:[grid-area:auto]"
          >
            <p className="eyebrow">{t("sky.noteEyebrow")}</p>
            <p className="display-sm">{t("sky.noteTitle")}</p>
            <p className="text-muted">{t("sky.noteBody")}</p>
          </div>
          <div data-cue="" aria-hidden="true" className="absolute inset-x-0 bottom-[calc(var(--home-dock)+22px)] mx-auto grid w-fit justify-items-center gap-2.5 text-[10px] font-semibold uppercase leading-none tracking-[0.24em] text-muted max-md:hidden motion-reduce:hidden">
            <span>{t("sky.cue")}</span>
            <i data-cue-line="" className="block h-9 w-px origin-top bg-[linear-gradient(var(--color-accent),transparent)]" />
          </div>
        </div>
      </section>

      {/* 02 Velocity Tunnel: light streaks, and the three ways to rent */}
      <section id="fleet" aria-labelledby="h-fleet" className={`${padX} relative z-[2] min-h-[180vh] motion-reduce:min-h-0`}>
        <div className="mx-auto grid max-w-[1120px] gap-10 pb-[30vh] pt-[34vh] motion-reduce:py-[20vh]">
          <header className="shadowed grid gap-[18px]">
            <Eyebrow num="02">{t("tunnel.eyebrow")}</Eyebrow>
            <h2 id="h-fleet" tabIndex={-1} className="display-md outline-none">
              {t("tunnel.title")}
            </h2>
            <p className="lede">{t("tunnel.lede")}</p>
          </header>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-4">
            {cards.map((card) => (
              <article
                key={card.key}
                className="relative grid content-start gap-3 rounded-card border border-line bg-[var(--card-veil)] p-6 backdrop-blur-[8px] transition-[border-color,translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-glow"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-hover">{t(`tunnel.${card.key}.kicker`)}</p>
                <h3 className="display-sm">
                  <Link href={card.href} className="no-underline after:absolute after:inset-0 after:rounded-card after:content-['']">
                    {t(`tunnel.${card.key}.title`)}
                  </Link>
                </h3>
                <p className="text-[15px] text-muted">{t(`tunnel.${card.key}.body`)}</p>
                <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-line pt-4 text-[22px] font-semibold leading-none tabular">
                  <span className="text-xs font-medium tracking-[0.06em] text-muted">{t("tunnel.from")}</span>
                  {formatAED(card.price)}
                  <small className="text-xs font-medium tracking-[0.06em] text-muted">{card.unit}</small>
                  {card.note && <small className="basis-full pt-1 text-xs font-medium tracking-[0.02em] text-muted">{card.note}</small>}
                </p>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <a className="btn btn-secondary" href="#sculpture">
              {t("tunnel.featured")}
            </a>
          </div>
        </div>
      </section>

      {/* 03 Kinetic Sculpture: the selected car comes apart into its parts */}
      <section id="sculpture" aria-labelledby="h-sculpt" className="relative z-[2] h-[300vh] motion-reduce:h-auto">
        <div
          data-frame=""
          className={`${padX} sticky top-0 grid h-svh content-center pb-[calc(var(--home-dock)+40px)] pt-[110px] max-md:content-start max-md:pt-24 motion-reduce:relative motion-reduce:h-auto motion-reduce:min-h-svh motion-reduce:pb-16`}
        >
          <div className="shadowed grid max-w-[430px] gap-5 max-md:gap-3.5">
            <Eyebrow num="03">{t("sculpture.eyebrow")}</Eyebrow>
            <h2 id="h-sculpt" tabIndex={-1} className="display-md outline-none">
              {t("sculpture.title")}
            </h2>
            <p className="lede max-md:text-[15px] max-md:[@media(max-height:760px)]:hidden">{t("sculpture.lede")}</p>
            <SculptureTabs tabs={tabs} panels={panels} />
          </div>
        </div>
      </section>

      {/* 04 Reserve: the car reassembles, lights up and launches; the reserve card rises */}
      <section id="reserve" aria-labelledby="h-res" className={`${padX} relative z-[2]`}>
        <div data-reserve-frame="" className="grid min-h-[190vh] content-end pb-[12vh] max-[899px]:pb-[6vh] motion-reduce:min-h-svh motion-reduce:pt-[20vh]">
          <div className="mx-auto grid w-full max-w-[1180px] items-end gap-7 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,440px)] min-[900px]:gap-10">
            <div className="shadowed grid gap-[18px]">
              <Eyebrow num="04">{t("reserve.eyebrow")}</Eyebrow>
              <h2 id="h-res" tabIndex={-1} className="display-md outline-none">
                {t("reserve.title")}
              </h2>
              <p className="lede">{t("reserve.lede", { reply: site.replyPromise })}</p>
              <ul className="trust" aria-label={t("reserve.trustLabel")}>
                <li>{t("reserve.trust.insurance")}</li>
                <li>{t("reserve.trust.vat")}</li>
                <li>{t("reserve.trust.delivery")}</li>
              </ul>
            </div>
            <ReserveSlot eyebrow={t("reserve.cardEyebrow")} />
          </div>
        </div>
      </section>
    </>
  );
}

/** Callout text for the desktop stage overlay, per top-5 car (serialisable for the client). */
export function stageCallouts(top: Car[]) {
  return top.map((car) => callouts(car).map((c) => ({ part: c.part, title: c.title, detail: c.detail })));
}

/** Plain CSS for visitors without JavaScript: the sticky story becomes a normal page. */
export const noScriptCss = [
  "[data-home] #skyline,[data-home] #sculpture{height:auto!important}",
  "[data-home] [data-frame]{position:relative!important;height:auto!important;min-height:100svh;row-gap:32px}",
  "[data-home] [data-sky-a],[data-home] [data-sky-b]{grid-area:auto!important}",
  "[data-home] [data-sky-b]{opacity:1!important;visibility:visible!important;justify-self:start!important}",
  "[data-home] [data-cue]{display:none!important}",
  "[data-home] #fleet{min-height:0!important}",
  "[data-home] [data-reserve-frame]{min-height:100svh!important;padding-top:20vh}",
].join("");
