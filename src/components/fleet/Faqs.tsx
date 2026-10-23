import clsx from "clsx";
import { Plus } from "lucide-react";

/**
 * FAQ accordion built on <details>/<summary>: keyboard and screen-reader friendly, and it
 * works before hydration (no JavaScript needed). The answers stay in the HTML for search.
 */
export function Faqs({ id, title, items, className }: { id: string; title: string; items: { q: string; a: string }[]; className?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={id} className={clsx("grid gap-6", className)}>
      <h2 id={id} className="display-sm">{title}</h2>
      <div className="grid border-t border-line">
        {items.map((item) => (
          <details key={item.q} className="group border-b border-line">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold transition-colors hover:text-accent-hover [&::-webkit-details-marker]:hidden">
              <span className="text-[15px] leading-snug">{item.q}</span>
              <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line text-accent transition-[transform,border-color] duration-200 group-open:rotate-45 group-open:border-accent motion-reduce:transition-none" aria-hidden="true">
                <Plus className="h-4 w-4" />
              </span>
            </summary>
            <p className="max-w-[68ch] pb-5 pe-12 text-[15px] leading-relaxed text-champagne">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
