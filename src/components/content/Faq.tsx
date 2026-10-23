import clsx from "clsx";
import { Plus } from "lucide-react";
import { Paras } from "./Rich";

export interface FaqItem {
  id?: string;
  q: string;
  /** Answer in copy mini-markup (`**bold**`, `[label](/path)`), paragraphs split by a blank line. */
  a: string;
}

/**
 * FAQ accordion built on <details>/<summary>: keyboard and screen-reader support come from
 * the browser, it works without JavaScript, and every answer is in the HTML for search.
 */
export function FaqList({ items, href, className, headingLevel = "h3" }: { items: FaqItem[]; href: (path: string) => string; className?: string; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <div className={clsx("border-t border-line", className)}>
      {items.map((item, i) => (
        <details key={item.id ?? i} id={item.id} className="group scroll-mt-[calc(var(--header-h)+24px)] border-b border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 rounded-md py-5 transition-colors hover:text-accent-hover [&::-webkit-details-marker]:hidden">
            <Heading className="text-[16px] font-semibold leading-snug md:text-[17px]">{item.q}</Heading>
            <span aria-hidden="true" className="grid h-9 w-9 flex-none place-items-center rounded-full border border-line text-accent transition-[transform,border-color] duration-200 group-open:rotate-45 group-open:border-accent/60">
              <Plus className="h-4 w-4" />
            </span>
          </summary>
          <div className="grid max-w-[68ch] gap-3 pb-6 pe-4 text-[15px] leading-relaxed text-champagne md:pe-14">
            <Paras text={item.a} href={href} />
          </div>
        </details>
      ))}
    </div>
  );
}
