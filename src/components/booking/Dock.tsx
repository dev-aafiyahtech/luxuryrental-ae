"use client";

// STUB — owned by the booking-flow workstream, which replaces this with the full dock:
// desktop: bottom-centre glass panel (where · from · until · type · Check availability);
// mobile: collapsed bar "Your trip · Sat 24 – Tue 27 · Edit trip" that opens a bottom sheet.
// Submitting goes to /cars with the trip saved in the shared draft. Keep the props stable.

import Link from "next/link";
import { useHref } from "@/i18n/client";

export interface DockProps {
  /** Hide the dock while another booking form is on screen (e.g. homepage chapter 4). */
  hidden?: boolean;
  className?: string;
}

export function Dock({ hidden, className }: DockProps) {
  const href = useHref();
  if (hidden) return null;
  return (
    <div className={`glass fixed inset-x-4 bottom-4 z-[var(--z-dock)] mx-auto flex max-w-[960px] items-center justify-between gap-4 p-3 ${className ?? ""}`}>
      <span className="ps-3 text-sm text-muted">Your trip</span>
      <Link className="btn btn-primary btn-sm" href={href("/cars")}>Check availability</Link>
    </div>
  );
}
