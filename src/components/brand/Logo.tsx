import clsx from "clsx";

// Temporary text wordmark ("LuxuryRental.ae", approved 23 Oct 2026).
// The brand agent replaces this with the SVG logo pack in public/brand/.
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-2 font-display text-[12px] font-bold tracking-[0.2em] text-fg", className)}>
      {compact ? (
        <span aria-hidden="true">LR<span className="text-accent">.AE</span></span>
      ) : (
        <span aria-hidden="true">
          LUXURY RENTAL<span className="text-accent">.AE</span>
        </span>
      )}
      <span className="sr-only">LuxuryRental.ae</span>
    </span>
  );
}
