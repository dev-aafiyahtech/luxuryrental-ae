import clsx from "clsx";
import { brandLogoFrame, brandLogos } from "@/content/brand-logos";

/**
 * A car-maker's mark as an inline SVG, e.g. `<BrandLogo slug="lamborghini" className="h-6 w-auto text-muted" />`.
 *
 * - Size it with a height class plus `w-auto`; the width follows the mark. Each mark carries an
 *   optical scale, so a wordmark (McLaren) and a crest (Ferrari) look the same size at one height.
 *   Without classes it is 1em tall.
 * - Colour comes from `currentColor`: use a text token (`text-muted`, `text-champagne`, `text-fg`),
 *   never the maker's colours. Never mirror it in RTL.
 * - Decorative by default (`aria-hidden`), because the brand name is always shown as text beside
 *   it. Pass `title` when the mark stands alone; it then becomes `role="img"` with that label.
 * - Returns null for a brand without a mark. Works in Server and Client Components.
 */
export function BrandLogo({ slug, className, title }: { slug: string; className?: string; title?: string }) {
  const frame = brandLogoFrame(slug);
  if (!frame) return null;
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={frame.viewBox}
      width={`${frame.aspect}em`}
      height="1em"
      fill="currentColor"
      focusable="false"
      data-brand-logo={slug}
      className={clsx("shrink-0", className)}
      {...a11y}
    >
      {title && <title>{title}</title>}
      <path d={brandLogos[slug as keyof typeof brandLogos].path} />
    </svg>
  );
}
