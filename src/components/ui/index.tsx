import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { Info, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

const btn = (variant: Variant, size: Size, block?: boolean, className?: string) =>
  clsx("btn", `btn-${variant}`, size === "sm" && "btn-sm", block && "btn-block", className);

/** Link styled as a button (navigation). */
export function ButtonLink({ variant = "primary", size = "md", block, className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; block?: boolean }) {
  return <Link className={btn(variant, size, block, className)} {...props} />;
}

/** Real button (actions). Pass `busy` to show the loading state; it stays focusable. */
export function Button({ variant = "primary", size = "md", block, busy, className, children, disabled, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size; block?: boolean; busy?: boolean }) {
  return (
    <button type="button" className={btn(variant, size, block, className)} aria-busy={busy || undefined} aria-disabled={disabled || busy || undefined} disabled={disabled} {...props}>
      {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
}

export { Breadcrumbs } from "./Breadcrumbs";

export function Badge({ children, muted, className }: { children: ReactNode; muted?: boolean; className?: string }) {
  return <span className={clsx("badge", muted && "badge-muted", className)}>{children}</span>;
}

const noticeIcons = { info: Info, warning: TriangleAlert, danger: CircleAlert, success: CircleCheck };

export function Notice({ tone = "info", title, children, className, role }: { tone?: keyof typeof noticeIcons; title?: string; children?: ReactNode; className?: string; role?: "status" | "alert" }) {
  const Icon = noticeIcons[tone];
  const color = { info: "text-info", warning: "text-warning", danger: "text-danger", success: "text-success" }[tone];
  return (
    <div className={clsx("notice", `notice-${tone}`, className)} role={role}>
      <Icon className={clsx("mt-0.5 h-5 w-5 flex-none", color)} aria-hidden="true" />
      <div className="grid gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-champagne">{children}</div>}
      </div>
    </div>
  );
}

export function Eyebrow({ num, children }: { num?: string; children: ReactNode }) {
  return (
    <p className="eyebrow">
      {num && <span className="num">{num}</span>}
      {children}
    </p>
  );
}

/** Page heading block used by inner pages. */
export function PageHeader({ eyebrow, title, lede, children }: { eyebrow?: string; title: string; lede?: ReactNode; children?: ReactNode }) {
  return (
    <header className="grid gap-5 pb-10 pt-10 md:pt-16">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="display-md max-w-4xl">{title}</h1>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </header>
  );
}
