"use client";

import clsx from "clsx";
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useT } from "@/i18n/client";

/**
 * Modal sheet on a native <dialog>: a bottom sheet on phones, a centred panel from 768 px.
 * Focus is trapped and restored by the browser; Esc and a backdrop tap close it.
 */
export function BottomSheet({ open, onClose, title, children, footer, size = "md", description }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
  description?: ReactNode;
}) {
  const t = useT("booking");
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // Close when the route is hidden by <Activity> or the sheet unmounts, so the page is never left inert.
  useLayoutEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
      document.documentElement.style.removeProperty("overflow");
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        document.documentElement.style.removeProperty("overflow");
        onCloseRef.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className={clsx(
        "fixed inset-0 z-[var(--z-sheet)] m-0 mt-auto max-h-[92dvh] w-full max-w-none flex-col overflow-hidden rounded-t-[24px] border border-b-0 border-line bg-card p-0 text-fg shadow-[0_-24px_70px_rgba(10,28,28,0.6)] backdrop:bg-bg/75",
        "md:m-auto md:max-h-[88dvh] md:rounded-[24px] md:border-b",
        size === "lg" ? "md:max-w-[760px]" : "md:max-w-[540px]",
        "open:flex [&:not([open])]:hidden",
        "motion-safe:transition-[opacity,translate] motion-safe:duration-200 starting:open:translate-y-6 starting:open:opacity-0",
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-5 md:px-6">
        <div className="grid gap-1">
          <h2 id={titleId} className="text-lg font-semibold leading-snug">{title}</h2>
          {description && <div className="text-sm text-muted">{description}</div>}
        </div>
        <button type="button" onClick={() => ref.current?.close()} className="-me-2 -mt-1 inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line text-fg hover:border-accent" aria-label={t("sheet.close")}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-6">{children}</div>
      {footer && <div className="border-t border-line px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 md:px-6">{footer}</div>}
    </dialog>
  );
}
