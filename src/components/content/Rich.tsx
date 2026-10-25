import Link from "next/link";
import { Fragment } from "react";

// Tiny renderer for the copy mini-markup used in src/content/pages: `**bold**` and
// `[label](/path)`. Internal paths go through the locale-aware `href`; mailto: and tel: links
// open in place; anything else opens in a new tab. Text is rendered as React nodes, never as HTML.

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

export const linkClass = "font-medium text-accent-hover underline decoration-accent/50 underline-offset-4 transition-colors hover:decoration-accent-hover";

/** `linkClassName` replaces the default link style (e.g. "text-fg" for quiet inline links). */
export function Rich({ text, href, linkClassName = linkClass }: { text: string; href: (path: string) => string; linkClassName?: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-fg">{part.slice(2, -2)}</strong>;
        const m = LINK.exec(part);
        if (m) {
          const [, label, url] = m;
          if (url.startsWith("/")) return <Link key={i} href={href(url)} className={linkClassName}>{label}</Link>;
          if (url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) return <a key={i} href={url} className={linkClassName}>{label}</a>;
          return <a key={i} href={url} className={linkClassName} target="_blank" rel="noopener">{label}</a>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** Paragraphs separated by a blank line. */
export function Paras({ text, href, className }: { text: string; href: (path: string) => string; className?: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className={className}>
          <Rich text={p} href={href} />
        </p>
      ))}
    </>
  );
}
