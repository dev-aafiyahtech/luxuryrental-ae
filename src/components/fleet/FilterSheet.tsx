"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useT } from "@/i18n/client";

/**
 * Mobile bottom sheet for the fleet filters (a modal <dialog>: focus is kept inside, Escape and the
 * backdrop close it). Filters apply as they change; the sticky footer shows the live result count.
 */
export function FilterSheet({ open, onClose, children, footer }: { open: boolean; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  const t = useT("fleet");
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 mt-auto h-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-[24px] border border-b-0 border-line bg-card p-0 text-fg shadow-[var(--shadow-edge)] transition-transform duration-300 ease-out backdrop:bg-bg/70 backdrop:backdrop-blur-sm starting:open:translate-y-full open:translate-y-0 lg:hidden"
    >
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <h2 id={titleId} className="display-sm">{t("filters.title")}</h2>
          <button type="button" onClick={onClose} aria-label={t("filters.close")} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-accent">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">{children}</div>
        <div className="flex items-center gap-3 border-t border-line bg-card px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>
      </div>
    </dialog>
  );
}
