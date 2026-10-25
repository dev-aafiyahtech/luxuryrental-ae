"use client";

import clsx from "clsx";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { localeHref, localeNames, otherLocale, stripLocale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

type Variant = "header" | "menu" | "footer";

const styles: Record<Variant, string> = {
  // Desktop header only: on smaller screens the switch sits in the mobile menu.
  header: "hidden h-11 items-center gap-2 rounded-full border border-line px-4 text-[13px] font-semibold text-fg no-underline transition-colors hover:border-accent lg:inline-flex",
  menu: "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold no-underline hover:border-accent",
  footer: "inline-flex min-h-11 items-center gap-2 text-sm text-muted no-underline hover:text-fg",
};

/**
 * Link to the same page in the other language ("العربية" on English pages, "English" on Arabic
 * ones), keeping the path and query. The link text is the language's own name, tagged with its
 * `lang` so screen readers switch voice. A plain <a>: the switch is a full page load, so the
 * document's lang, dir and fonts change cleanly.
 */
export function LanguageSwitch({ variant, className }: { variant: Variant; className?: string }) {
  // The query is only known in the browser; the server renders the link without it.
  return (
    <Suspense fallback={<SwitchLink variant={variant} className={className} query="" />}>
      <SwitchWithQuery variant={variant} className={className} />
    </Suspense>
  );
}

function SwitchWithQuery(props: { variant: Variant; className?: string }) {
  const query = useSearchParams().toString();
  return <SwitchLink {...props} query={query ? `?${query}` : ""} />;
}

function SwitchLink({ variant, className, query }: { variant: Variant; className?: string; query: string }) {
  const target = otherLocale(useLocale());
  // On the server the English pathname may still carry the internal "/en" prefix; strip either way.
  const path = stripLocale(usePathname() ?? "/");
  return (
    <a href={`${localeHref(target, path)}${query}`} hrefLang={target} lang={target} className={clsx(styles[variant], className)}>
      <Languages className="h-4 w-4 flex-none" aria-hidden="true" />
      {localeNames[target]}
    </a>
  );
}
