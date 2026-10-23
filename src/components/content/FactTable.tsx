import clsx from "clsx";
import type { ReactNode } from "react";

// Fact tables for the content pages (numbers in HTML tables, workstream 07 §7.4).
//
// Two mobile behaviours:
// - "scroll" (default): the table scrolls sideways inside its own frame with a sticky first
//   column, so the page itself never overflows.
// - "stack": below 768 px every row becomes a card of label/value pairs.

export interface FactColumn {
  label: ReactNode;
  /** Plain-text label for stacked cards (defaults to `label` when it is a string). */
  short?: string;
  align?: "start" | "end";
  className?: string;
}

export interface FactRow {
  key: string;
  cells: ReactNode[];
  highlight?: boolean;
}

export function FactTable({
  id, caption, captionHidden, columns, rows, mode = "scroll", minWidth, footnote, className, rowHeader = true,
}: {
  id: string;
  caption: ReactNode;
  captionHidden?: boolean;
  columns: FactColumn[];
  rows: FactRow[];
  mode?: "scroll" | "stack";
  minWidth?: number;
  footnote?: ReactNode;
  className?: string;
  rowHeader?: boolean;
}) {
  const stack = mode === "stack";
  const captionId = `${id}-caption`;
  const alignCls = (c: FactColumn) => (c.align === "end" ? "text-end" : "text-start");
  const labelOf = (c: FactColumn) => c.short ?? (typeof c.label === "string" ? c.label : "");

  return (
    <figure className={clsx("grid min-w-0 gap-3", className)}>
      <div
        role="region"
        aria-labelledby={captionId}
        tabIndex={stack ? undefined : 0}
        className={clsx(
          "relative min-w-0",
          stack
            ? "md:overflow-hidden md:rounded-[var(--radius-card)] md:border md:border-line md:bg-card"
            : "overflow-x-auto overscroll-x-contain rounded-[var(--radius-card)] border border-line bg-card [scrollbar-color:var(--color-line)_transparent] [scrollbar-width:thin]",
        )}
      >
        <table className={clsx("tabular w-full border-separate border-spacing-0 text-[14px] leading-snug", stack && "max-md:block")} style={!stack && minWidth ? { minWidth } : undefined}>
          <caption id={captionId} className={clsx("text-start", captionHidden ? "sr-only" : "px-5 pb-1 pt-5 font-semibold text-fg max-md:px-0", stack && !captionHidden && "md:px-5")}>
            {caption}
          </caption>
          <thead className={clsx(stack && "max-md:sr-only")}>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  scope="col"
                  className={clsx(
                    "whitespace-nowrap border-b border-line bg-card px-4 py-3.5 align-bottom text-[11px] font-semibold uppercase tracking-[0.14em] text-muted first:ps-5 last:pe-5",
                    alignCls(c),
                    i === 0 && !stack && "sticky start-0 z-[2] border-e",
                    c.className,
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={clsx(stack && "max-md:grid max-md:gap-3")}>
            {rows.map((row) => (
              <tr
                key={row.key}
                className={clsx(
                  "group/row",
                  row.highlight && "[&>*]:bg-elevated/60",
                  stack && "max-md:grid max-md:gap-0 max-md:overflow-hidden max-md:rounded-[var(--radius-card)] max-md:border max-md:border-line max-md:bg-card",
                )}
              >
                {row.cells.map((cell, i) => {
                  const Cell = i === 0 && rowHeader ? "th" : "td";
                  const label = labelOf(columns[i]);
                  return (
                    <Cell
                      key={i}
                      scope={Cell === "th" ? "row" : undefined}
                      data-label={label}
                      className={clsx(
                        "border-b border-line bg-card px-4 py-3.5 align-top transition-colors first:ps-5 last:pe-5 group-last/row:border-b-0 group-hover/row:bg-elevated/40",
                        alignCls(columns[i]),
                        i === 0 ? "font-semibold text-fg" : "text-champagne",
                        i === 0 && !stack && "sticky start-0 z-[1] min-w-[8.5rem] border-e sm:min-w-[11rem]",
                        i > 0 && !stack && "whitespace-nowrap",
                        stack && i === 0 && "max-md:border-b max-md:bg-elevated/50 max-md:text-[15px]",
                        stack && i > 0 && "max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-4 max-md:text-end max-md:before:shrink-0 max-md:before:text-start max-md:before:text-[11px] max-md:before:font-semibold max-md:before:uppercase max-md:before:tracking-[0.14em] max-md:before:text-muted max-md:before:content-[attr(data-label)] max-md:last:border-b-0",
                        columns[i].className,
                      )}
                    >
                      {cell}
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && <figcaption className="fine leading-relaxed">{footnote}</figcaption>}
    </figure>
  );
}

/** A muted secondary line inside a table cell. */
export function CellNote({ children }: { children: ReactNode }) {
  return <span className="mt-1 block text-[12px] font-normal leading-snug text-muted">{children}</span>;
}
