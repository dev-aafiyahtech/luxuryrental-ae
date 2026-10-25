"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useT } from "@/i18n/client";

/** Breadcrumb trail. The landmark label comes from the page's language (common.nav.breadcrumb). */
export function Breadcrumbs({ items, label }: { items: { label: string; href?: string }[]; label?: string }) {
  const t = useT("common");
  return (
    <nav aria-label={label ?? t("nav.breadcrumb")} className="text-[12px] text-muted">
      <ol className="flex flex-wrap items-center gap-1 p-0 [list-style:none]">
        {items.map((item, i) => (
          <li key={i} className="inline-flex items-center gap-1">
            {item.href ? <Link href={item.href} className="no-underline hover:text-fg">{item.label}</Link> : <span aria-current="page" className="text-fg">{item.label}</span>}
            {i < items.length - 1 && <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
