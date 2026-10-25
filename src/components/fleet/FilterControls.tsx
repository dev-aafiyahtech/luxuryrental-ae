"use client";

import Link from "next/link";
import clsx from "clsx";
import { useId, type MouseEvent } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { categories } from "@/content/brands";
import { useT } from "@/i18n/client";
import { PRICE_BUCKETS, SORT_KEYS, type FleetFilters, type SortKey } from "./filters";

export interface FilterControlsProps {
  filters: FleetFilters;
  /** Missing before hydration: the controls then submit the surrounding GET form instead. */
  onChange?: (next: FleetFilters) => void;
  layout: "bar" | "sheet";
  brandLinks: { label: string; href: string }[];
  chauffeurHref: string;
  /** Category names in the page language, by slug. */
  categoryNames?: Record<string, string>;
}

const SORT_LABEL: Record<SortKey, string> = { featured: "sortFeatured", "price-asc": "sortPriceAsc", "price-desc": "sortPriceDesc", power: "sortPower" };

const chip =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200";
const chipOff = "border-line text-muted hover:border-input hover:text-fg";
const chipOn = "border-accent bg-accent/10 text-accent-hover";

export function FilterControls({ filters, onChange, layout, brandLinks, chauffeurHref, categoryNames }: FilterControlsProps) {
  const t = useT("fleet");
  const id = useId();
  const sheet = layout === "sheet";

  // Before hydration the buttons are real submit buttons of a GET form; afterwards they update the URL in place.
  const act = (next: FleetFilters) => (e: MouseEvent) => {
    if (!onChange) return;
    e.preventDefault();
    onChange(next);
  };

  const categoryOptions = [{ slug: undefined, label: t("filters.all") }, ...categories.map((c) => ({ slug: c.slug, label: categoryNames?.[c.slug] ?? c.name }))];

  const categoryGroup = (
    <div className={clsx("grid gap-3", !sheet && "min-w-0")}>
      <p id={`${id}-cat`} className={clsx("label", !sheet && "sr-only")}>{t("filters.category")}</p>
      <div className={clsx("flex flex-wrap items-center gap-2", !sheet && "gap-3")}>
        <div role="group" aria-labelledby={`${id}-cat`} className={clsx(sheet ? "flex flex-wrap gap-2" : "inline-flex flex-wrap rounded-full border border-line bg-card p-1")}>
          {categoryOptions.map((o) => {
            const on = filters.category === o.slug;
            return (
              <button
                key={o.label}
                type="submit"
                name="category"
                value={o.slug ?? ""}
                aria-pressed={on}
                onClick={act({ ...filters, category: o.slug })}
                className={clsx(
                  sheet ? clsx(chip, on ? chipOn : chipOff) : "inline-flex min-h-11 items-center rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200",
                  !sheet && (on ? "bg-accent text-on-accent" : "text-muted hover:text-fg"),
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <Link href={chauffeurHref} className={clsx(chip, chipOff, "no-underline")}>
          {t("filters.chauffeur")}
          <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          <span className="sr-only">({t("filters.chauffeurHint")})</span>
        </Link>
      </div>
    </div>
  );

  const priceGroup = (
    <div className={clsx(sheet ? "grid gap-3" : "flex flex-wrap items-center gap-3")}>
      <p id={`${id}-price`} className="label">{t("filters.price")}</p>
      <div role="group" aria-labelledby={`${id}-price`} className={clsx(sheet ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2")}>
        {PRICE_BUCKETS.map((b) => {
          const on = filters.price === b;
          return (
            <button key={b} type="submit" name="price" value={b} aria-pressed={on} onClick={act({ ...filters, price: on ? undefined : b })} className={clsx(chip, on ? chipOn : chipOff, "tabular")}>
              {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              {t(`filters.${b}`)}
            </button>
          );
        })}
      </div>
    </div>
  );

  const chauffeurSwitch = (
    <button
      type="submit"
      name="chauffeur"
      value={filters.chauffeur ? "" : "1"}
      role="switch"
      aria-checked={filters.chauffeur}
      onClick={act({ ...filters, chauffeur: !filters.chauffeur })}
      className={clsx("group inline-flex min-h-11 items-center gap-3 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors", sheet ? "w-full justify-between" : "px-1", filters.chauffeur ? "text-fg" : "text-muted hover:text-fg")}
    >
      <span>{t("filters.chauffeurToggle")}</span>
      <span aria-hidden="true" className={clsx("relative inline-flex h-6 w-11 flex-none items-center rounded-full border transition-colors duration-200", filters.chauffeur ? "border-accent bg-accent" : "border-input bg-elevated")}>
        <span className={clsx("absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-[inset-inline-start,background-color] duration-200", filters.chauffeur ? "start-[22px] bg-on-accent" : "start-[3px] bg-champagne")} />
      </span>
    </button>
  );

  const sortField = (
    <div className={clsx(sheet ? "field" : "flex items-center gap-3")}>
      <label htmlFor={`${id}-sort`} className={clsx(!sheet && "label")}>{t("filters.sort")}</label>
      <select
        id={`${id}-sort`}
        name="sort"
        className={clsx("input", !sheet && "w-auto min-w-[200px]")}
        value={filters.sort}
        onChange={(e) => onChange?.({ ...filters, sort: e.target.value as SortKey })}
      >
        {SORT_KEYS.map((k) => <option key={k} value={k}>{t(`filters.${SORT_LABEL[k]}`)}</option>)}
      </select>
    </div>
  );

  const brandGroup = (
    <nav aria-labelledby={`${id}-brands`} className={clsx(sheet ? "grid gap-3" : "flex flex-wrap items-center gap-3")}>
      <p id={`${id}-brands`} className="label">{t("filters.brands")}</p>
      <ul className="flex flex-wrap gap-2 p-0 [list-style:none]">
        {brandLinks.map((b) => (
          <li key={b.href}>
            <Link href={b.href} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[13px] text-champagne no-underline transition-colors hover:border-accent hover:text-fg">
              {b.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  if (sheet) {
    return (
      <div className="grid gap-7">
        {categoryGroup}
        {priceGroup}
        <div className="border-y border-line py-2">{chauffeurSwitch}</div>
        {sortField}
        {brandGroup}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {categoryGroup}
        {sortField}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4">
        {priceGroup}
        <span className="hidden h-6 w-px bg-line xl:block" aria-hidden="true" />
        {chauffeurSwitch}
      </div>
      <div className="border-t border-line pt-4">{brandGroup}</div>
    </div>
  );
}
