"use client";

import clsx from "clsx";
import { useMemo, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { categories } from "@/content/brands";
import { useHref, useT } from "@/i18n/client";
import { FilterControls } from "./FilterControls";
import { FilterSheet } from "./FilterSheet";
import { TripBar } from "./TripBar";
import { activeFilterCount, applyFilters, carMeta, DEFAULT_FILTERS, nearestMatches, type FleetFilters } from "./filters";

export interface FleetViewProps {
  filters: FleetFilters;
  /** Missing in the server-rendered fallback (before hydration). */
  onChange?: (next: FleetFilters) => void;
  today: string;
  /** Server-rendered car cards keyed by car slug. */
  cards: Record<string, ReactNode>;
  /** Chauffeur cross-sell card, placed after the second row. */
  crossSell: ReactNode;
  brandLinks: { label: string; href: string }[];
  brandCount: number;
}

export function FleetView({ filters, onChange, today, cards, crossSell, brandLinks, brandCount }: FleetViewProps) {
  const t = useT("fleet");
  const href = useHref();
  const [sheetOpen, setSheetOpen] = useState(false);
  const meta = useMemo(() => carMeta(today), [today]);
  const results = useMemo(() => applyFilters(meta, filters), [meta, filters]);
  const nearest = useMemo(() => (results.length ? [] : nearestMatches(meta, filters)), [meta, filters, results.length]);
  const active = activeFilterCount(filters);
  const total = meta.length;
  const shown = results.length;

  const countLabel = shown === 1 ? t("fleet.countOne") : t("fleet.count", { count: shown });
  const showLabel = shown === 0 ? t("filters.showNone") : shown === 1 ? t("filters.showOne") : t("filters.show", { count: shown });
  const clear = () => onChange?.({ ...DEFAULT_FILTERS, sort: filters.sort });

  const activeChips = [
    filters.category && { label: categories.find((c) => c.slug === filters.category)?.name ?? filters.category, next: { ...filters, category: undefined } },
    filters.price && { label: t(`filters.${filters.price}`), next: { ...filters, price: undefined } },
    filters.chauffeur && { label: t("filters.chauffeurToggle"), next: { ...filters, chauffeur: false } },
  ].filter(Boolean) as { label: string; next: FleetFilters }[];

  return (
    <div className="grid gap-8">
      <header className="grid gap-5 pt-10 md:pt-14">
        <p className="eyebrow">{t("fleet.eyebrow", { cars: total, brands: brandCount })}</p>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h1 className="display-md">{t("fleet.title")}</h1>
          <p className="font-display text-lg font-bold uppercase tracking-[0.06em] text-accent-hover tabular" aria-live="polite" aria-atomic="true">
            <span aria-hidden="true">{countLabel}</span>
            <span className="sr-only">{t("fleet.showing", { shown, total })}</span>
          </p>
        </div>
        <p className="lede">{t("fleet.lede")}</p>
      </header>

      <TripBar />

      {/* Desktop filter bar. A real GET form, so it works before hydration too. */}
      <form action={href("/cars")} method="get" aria-label={t("filters.label")} className="hidden border-y border-line py-5 lg:block">
        <FilterControls layout="bar" filters={filters} onChange={onChange} brandLinks={brandLinks} chauffeurHref={href("/chauffeur")} />
        {active > 0 && (
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={clear} className="btn btn-ghost btn-sm">{t("filters.clear")}</button>
          </div>
        )}
      </form>

      {/* Mobile: one button opens the filter sheet; active filters show as removable chips. */}
      <div className="grid gap-3 lg:hidden">
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-secondary btn-sm gap-2" aria-haspopup="dialog" aria-expanded={sheetOpen} onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {t("filters.open")}
            {active > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] tracking-normal text-on-accent tabular">{active}</span>}
          </button>
          {active > 0 && <button type="button" onClick={clear} className="btn btn-ghost btn-sm">{t("filters.clear")}</button>}
        </div>
        {activeChips.length > 0 && (
          <ul aria-label={t("filters.active")} className="flex flex-wrap gap-2 p-0 [list-style:none]">
            {activeChips.map((c) => (
              <li key={c.label}>
                <button type="button" onClick={() => onChange?.(c.next)} aria-label={t("filters.remove", { label: c.label })} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent/60 bg-accent/10 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-hover">
                  {c.label}
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {shown > 0 ? (
        <ul aria-label={t("fleet.listLabel")} className="grid gap-4 p-0 [list-style:none] md:grid-cols-2 md:gap-5 min-[90rem]:grid-cols-3">
          {results.map((c, i) => (
            <li key={c.slug} style={{ order: i * 2 }} className="grid">
              {cards[c.slug]}
            </li>
          ))}
          <li className="order-3 grid md:order-7 min-[90rem]:order-11">{crossSell}</li>
        </ul>
      ) : (
        <section aria-labelledby="fleet-empty" className="grid gap-8">
          <div className="card grid justify-items-start gap-4 p-6 md:p-8">
            <h2 id="fleet-empty" className="display-sm">{t("empty.title")}</h2>
            <p className="max-w-[60ch] text-muted">{t("empty.body")}</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={clear} className="btn btn-primary">{t("filters.clear")}</button>
              {filters.price && <button type="button" onClick={() => onChange?.({ ...filters, price: undefined })} className="btn btn-secondary">{t("filters.clearPrice")}</button>}
            </div>
          </div>
          <div className="grid gap-4">
            <p className="label">{t("empty.nearest")}</p>
            <ul aria-label={t("empty.nearest")} className="grid gap-4 p-0 [list-style:none] md:grid-cols-2 md:gap-5 min-[90rem]:grid-cols-3">
              {nearest.map((c) => <li key={c.slug} className="grid">{cards[c.slug]}</li>)}
            </ul>
          </div>
        </section>
      )}

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        footer={
          <>
            {active > 0 && <button type="button" onClick={clear} className="btn btn-ghost btn-sm">{t("filters.clear")}</button>}
            <button type="button" onClick={() => setSheetOpen(false)} className={clsx("btn btn-primary flex-1")}>{showLabel}</button>
          </>
        }
      >
        <FilterControls layout="sheet" filters={filters} onChange={onChange} brandLinks={brandLinks} chauffeurHref={href("/chauffeur")} />
      </FilterSheet>
    </div>
  );
}
