"use client";

import clsx from "clsx";
import { useId, useState, type MouseEvent, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import type { DamageMark } from "@/lib/booking/types";

// Generic top-down car outline for condition reports (not any specific make). The front is at
// the top and the car's left is on the viewer's left. Mark coordinates are 0–1 across the
// 200 × 400 viewBox and the drawing is never mirrored, so marks keep their place in RTL.

const VB_W = 200;
const VB_H = 400;

export const DAMAGE_KINDS: DamageMark["kind"][] = ["scratch", "dent", "chip", "scuff", "other"];

/** Named areas (for the keyboard form and for describing a tapped point), in viewBox units. */
const ZONES: { id: string; x: number; y: number }[] = [
  { id: "front-bumper", x: 100, y: 22 },
  { id: "bonnet", x: 100, y: 82 },
  { id: "windscreen", x: 100, y: 160 },
  { id: "roof", x: 100, y: 226 },
  { id: "rear-window", x: 100, y: 288 },
  { id: "boot", x: 100, y: 344 },
  { id: "rear-bumper", x: 100, y: 382 },
  { id: "left-front-wing", x: 40, y: 118 },
  { id: "right-front-wing", x: 160, y: 118 },
  { id: "left-front-wheel", x: 21, y: 97 },
  { id: "right-front-wheel", x: 179, y: 97 },
  { id: "left-mirror", x: 14, y: 144 },
  { id: "right-mirror", x: 186, y: 144 },
  { id: "left-doors", x: 34, y: 226 },
  { id: "right-doors", x: 166, y: 226 },
  { id: "left-rear-wing", x: 40, y: 330 },
  { id: "right-rear-wing", x: 160, y: 330 },
  { id: "left-rear-wheel", x: 21, y: 303 },
  { id: "right-rear-wheel", x: 179, y: 303 },
];

/** The named area closest to a mark. */
export function zoneOf(m: Pick<DamageMark, "x" | "y">): string {
  let best = ZONES[0];
  let dist = Infinity;
  for (const z of ZONES) {
    const d = Math.hypot(m.x * VB_W - z.x, m.y * VB_H - z.y);
    if (d < dist) {
      dist = d;
      best = z;
    }
  }
  return best.id;
}

const newId = () => `dm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const clamp = (v: number) => Math.min(0.98, Math.max(0.02, v));

/** The outline itself (decorative: the marks list carries the meaning). */
function Outline() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* wheels */}
      <g className="fill-line print:fill-neutral-400" stroke="none">
        <rect x="15" y="70" width="13" height="54" rx="4" />
        <rect x="172" y="70" width="13" height="54" rx="4" />
        <rect x="15" y="276" width="13" height="54" rx="4" />
        <rect x="172" y="276" width="13" height="54" rx="4" />
      </g>
      {/* mirrors */}
      <path d="M27 139 L12 135 Q7 142 10 149 L27 153 Z" className="fill-elevated print:fill-white" stroke="currentColor" strokeWidth="1.5" />
      <path d="M173 139 L188 135 Q193 142 190 149 L173 153 Z" className="fill-elevated print:fill-white" stroke="currentColor" strokeWidth="1.5" />
      {/* body */}
      <path
        d="M100 14 C128 14 150 18 160 30 C170 44 173 66 174 96 L174 300 C174 340 171 364 160 376 C148 386 126 388 100 388 C74 388 52 386 40 376 C29 364 26 340 26 300 L26 96 C27 66 30 44 40 30 C50 18 72 14 100 14 Z"
        className="fill-card print:fill-white"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* bonnet creases */}
      <path d="M68 28 Q61 80 58 140 M132 28 Q139 80 142 140" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      {/* lights */}
      <path d="M37 41 Q47 26 67 22 L67 30 Q51 34 43 47 Z M163 41 Q153 26 133 22 L133 30 Q149 34 157 47 Z" className="fill-elevated print:fill-white" stroke="currentColor" strokeWidth="1.2" />
      <path d="M35 365 Q45 380 66 384 L66 377 Q49 374 41 361 Z M165 365 Q155 380 134 384 L134 377 Q151 374 159 361 Z" className="fill-elevated print:fill-white" stroke="currentColor" strokeWidth="1.2" />
      {/* glass */}
      <path d="M46 146 Q100 124 154 146 L146 187 Q100 175 54 187 Z" className="fill-elevated print:fill-neutral-100" stroke="currentColor" strokeWidth="1.5" />
      <path d="M54 266 Q100 277 146 266 L152 301 Q100 317 48 301 Z" className="fill-elevated print:fill-neutral-100" stroke="currentColor" strokeWidth="1.5" />
      {/* roof and side glass */}
      <path d="M56 191 Q100 181 144 191 L144 262 Q100 271 56 262 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <path d="M42 153 L50 189 L50 263 L44 297 M158 153 L150 189 L150 263 L156 297" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
      {/* door shut lines */}
      <path d="M26 196 H36 M26 258 H36 M174 196 H164 M174 258 H164" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </g>
  );
}

function Marks({ marks, selected, onSelect, t }: { marks: DamageMark[]; selected?: string | null; onSelect?: (id: string) => void; t: (k: string, v?: Record<string, string | number>) => string }) {
  return (
    <g>
      {marks.map((m, i) => {
        const cx = m.x * VB_W;
        const cy = m.y * VB_H;
        const on = selected === m.id;
        return (
          <g
            key={m.id}
            className={onSelect ? "cursor-pointer" : undefined}
            onClick={
              onSelect
                ? (e) => {
                    e.stopPropagation();
                    onSelect(m.id);
                  }
                : undefined
            }
          >
            <title>{t("diagram.markLabel", { n: i + 1, kind: t(`diagram.kinds.${m.kind}`), zone: t(`diagram.zones.${zoneOf(m)}`) })}</title>
            {onSelect && <circle cx={cx} cy={cy} r="16" fill="transparent" />}
            {on && <circle cx={cx} cy={cy} r="15" fill="none" className="stroke-accent-hover" strokeWidth="2.5" />}
            <circle cx={cx} cy={cy} r="10" className="fill-accent stroke-bg print:fill-white print:stroke-black" strokeWidth="2" />
            <text x={cx} y={cy} dy="0.36em" textAnchor="middle" className="fill-on-accent font-body text-[11px] font-bold print:fill-black">
              {i + 1}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Front / rear / left / right labels around the outline; always left-to-right (the drawing is never mirrored). */
function Frame({ children, t, className }: { children: ReactNode; t: (k: string) => string; className?: string }) {
  const side = "label shrink-0 select-none [writing-mode:vertical-rl]";
  return (
    <figure dir="ltr" className={clsx("m-0 grid justify-items-center gap-1.5", className)}>
      <span className="label select-none">{t("diagram.front")}</span>
      <div className="flex w-full items-center justify-center gap-1.5">
        <span className={clsx(side, "rotate-180")}>{t("diagram.left")}</span>
        {children}
        <span className={side}>{t("diagram.right")}</span>
      </div>
      <span className="label select-none">{t("diagram.rear")}</span>
    </figure>
  );
}

/** Numbered list of marks, so the diagram is never the only way to read them. */
function MarkList({ marks, t, className }: { marks: DamageMark[]; t: (k: string, v?: Record<string, string | number>) => string; className?: string }) {
  if (!marks.length) return <p className={clsx("text-sm text-muted", className)}>{t("diagram.none")}</p>;
  return (
    <ol aria-label={t("diagram.list")} className={clsx("m-0 grid list-none gap-0 p-0", className)}>
      {marks.map((m, i) => (
        <li key={m.id} className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 border-b border-line py-2.5 last:border-b-0">
          <span aria-hidden="true" className="mt-px inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent tabular print:border print:border-black print:bg-white">{i + 1}</span>
          <p className="m-0 text-sm text-fg">
            <span className="sr-only">{i + 1}. </span>
            <span className="font-semibold">{t(`diagram.kinds.${m.kind}`)}</span>
            <span className="text-muted"> · {t(`diagram.zones.${zoneOf(m)}`)}</span>
            {m.note && <span className="block text-champagne">{m.note}</span>}
          </p>
        </li>
      ))}
    </ol>
  );
}

/**
 * Condition-report diagram. Read-only by default (outline + numbered marks + list).
 * Pass `onChange` for the ops edit mode: tap the outline to add a mark of the chosen kind,
 * tap a mark to select it, edit kind/note or remove it in the list, or add one by area
 * with the keyboard form.
 */
export function CarDiagram({ marks, onChange, className }: { marks: DamageMark[]; onChange?: (marks: DamageMark[]) => void; className?: string }) {
  const t = useT("agreement");
  const uid = useId();
  const [kind, setKind] = useState<DamageMark["kind"]>("scratch");
  const [zone, setZone] = useState(ZONES[0].id);
  const [selected, setSelected] = useState<string | null>(null);
  const [live, setLive] = useState("");
  const label = marks.length ? t("diagram.labelMarks", { n: marks.length }) : t("diagram.label");

  if (!onChange) {
    return (
      <div className={clsx("grid items-start gap-6 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]", className)}>
        <Frame t={t}>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label={label} className="h-auto w-full max-w-[170px] text-muted print:text-black">
            <Outline />
            <Marks marks={marks} t={t} />
          </svg>
        </Frame>
        <MarkList marks={marks} t={t} />
      </div>
    );
  }

  const add = (x: number, y: number, how: "tap" | "area") => {
    const m: DamageMark = { id: newId(), x: clamp(x), y: clamp(y), kind };
    onChange([...marks, m]);
    setSelected(m.id);
    setLive(t("diagram.added", { n: marks.length + 1, kind: t(`diagram.kinds.${kind}`), zone: t(`diagram.zones.${how === "area" ? zone : zoneOf(m)}`) }));
  };

  const onTap = (e: MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    add(p.x / VB_W, p.y / VB_H, "tap");
  };

  const addByArea = () => {
    const z = ZONES.find((v) => v.id === zone) ?? ZONES[0];
    // Nudge repeated marks in the same area so they don't sit on top of each other.
    const near = marks.filter((m) => Math.hypot(m.x * VB_W - z.x, m.y * VB_H - z.y) < 8).length;
    const dx = near ? (near % 2 ? 1 : -1) * Math.ceil(near / 2) * 9 : 0;
    add((z.x + dx) / VB_W, z.y / VB_H, "area");
  };

  const update = (id: string, patch: Partial<DamageMark>) => onChange(marks.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const remove = (id: string, n: number) => {
    onChange(marks.filter((m) => m.id !== id));
    if (selected === id) setSelected(null);
    setLive(t("diagram.removed", { n }));
  };

  return (
    <div className={clsx("grid gap-5", className)}>
      <fieldset className="m-0 grid gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("diagram.kindNew")}</legend>
        <div className="flex flex-wrap gap-2">
          {DAMAGE_KINDS.map((k) => (
            <label key={k} className={clsx("inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[13px] font-semibold transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring", kind === k ? "border-accent bg-accent text-on-accent" : "border-input text-fg hover:border-accent")}>
              <input type="radio" name={`${uid}-kind`} value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {t(`diagram.kinds.${k}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div className="grid gap-2">
          <p className="field-hint">{t("diagram.editHint")}</p>
          <Frame t={t}>
            <svg viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label={label} onClick={onTap} className="h-auto w-full max-w-[200px] cursor-crosshair touch-manipulation text-muted">
              <Outline />
              <Marks marks={marks} selected={selected} onSelect={setSelected} t={t} />
            </svg>
          </Frame>
        </div>

        <div className="grid content-start gap-5">
          {marks.length === 0 ? (
            <p className="text-sm text-muted">{t("diagram.none")}</p>
          ) : (
            <ol aria-label={t("diagram.list")} className="m-0 grid list-none gap-3 p-0">
              {marks.map((m, i) => {
                const n = i + 1;
                return (
                  <li
                    key={m.id}
                    onFocus={() => setSelected(m.id)}
                    className={clsx("grid gap-3 rounded-xl border p-3 transition-colors duration-200", selected === m.id ? "border-accent" : "border-line")}
                  >
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent tabular">{n}</span>
                      <p className="m-0 min-w-0 flex-1 text-sm">
                        <span className="sr-only">{n}. </span>
                        <span className="font-semibold">{t(`diagram.kinds.${m.kind}`)}</span>
                        <span className="text-muted"> · {t(`diagram.zones.${zoneOf(m)}`)}</span>
                      </p>
                      <button type="button" className="-me-1 inline-flex h-11 w-11 flex-none items-center justify-center rounded-full text-muted hover:text-fg" aria-label={t("diagram.removeMark", { n })} onClick={() => remove(m.id, n)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                      <div className="field">
                        <label htmlFor={`${uid}-k-${m.id}`}>{t("diagram.kind")}<span className="sr-only"> {n}</span></label>
                        <select id={`${uid}-k-${m.id}`} className="input" value={m.kind} onChange={(e) => update(m.id, { kind: e.target.value as DamageMark["kind"] })}>
                          {DAMAGE_KINDS.map((k) => <option key={k} value={k}>{t(`diagram.kinds.${k}`)}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor={`${uid}-n-${m.id}`}>{t("diagram.note")}<span className="sr-only"> {n}</span></label>
                        <input id={`${uid}-n-${m.id}`} className="input" value={m.note ?? ""} maxLength={120} autoComplete="off" onChange={(e) => update(m.id, { note: e.target.value || undefined })} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <fieldset className="m-0 grid gap-3 rounded-xl border border-dashed border-line p-3">
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("diagram.byArea")}</legend>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="field">
                <label htmlFor={`${uid}-zone`}>{t("diagram.area")}</label>
                <select id={`${uid}-zone`} className="input" value={zone} onChange={(e) => setZone(e.target.value)}>
                  {ZONES.map((z) => <option key={z.id} value={z.id}>{t(`diagram.zones.${z.id}`)}</option>)}
                </select>
              </div>
              <button type="button" className="btn btn-secondary btn-sm gap-2" onClick={addByArea}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("diagram.add")} · {t(`diagram.kinds.${kind}`)}
              </button>
            </div>
          </fieldset>
        </div>
      </div>
      <p className="sr-only" role="status">{live}</p>
    </div>
  );
}

/** Read-only list of marks without the drawing (for compact summaries). */
export function DamageList({ marks, className }: { marks: DamageMark[]; className?: string }) {
  const t = useT("agreement");
  return <MarkList marks={marks} t={t} className={className} />;
}
