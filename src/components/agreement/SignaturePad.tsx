"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Eraser } from "lucide-react";
import { useT } from "@/i18n/client";
import { Checkbox, FieldError } from "@/components/booking/Field";

// Canvas e-signature (simulated in the demo). Strokes are kept as normalised points and
// redrawn on resize, so the pad stays sharp at any devicePixelRatio. The exported PNG is
// redrawn from the same points at a fixed 600 px width: ink in the `fg` colour on a
// transparent background (print views turn it black with a CSS filter).

type Point = { x: number; y: number; w: number }; // x, y: 0–1 across the pad; w: width factor
type Stroke = Point[];

const EXPORT_W = 600;
const RATIO = 16 / 7; // pad width / height (matches aspect-[16/7])
const EXPORT_H = Math.round(EXPORT_W / RATIO);
const SCRIPT_FALLBACK = '"Segoe Script", "Snell Roundhand", "Apple Chancery", "Brush Script MT", "URW Chancery L", "Z003", cursive';
/** The loaded signature face (Allura via next/font, `--font-signature`) first, then system script fonts. */
const signatureFamily = () => getComputedStyle(document.documentElement).getPropertyValue("--font-signature").trim();
const scriptFont = () => [signatureFamily(), SCRIPT_FALLBACK].filter(Boolean).join(", ");

function inkColour(el: HTMLElement): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--color-fg").trim() || getComputedStyle(el).color;
}

const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const baseWidth = (w: number) => Math.max(1.8, w * 0.0052);

/** Draws the piece of a stroke that becomes final once point `i` exists (midpoint quadratic smoothing). */
function drawSegment(ctx: CanvasRenderingContext2D, s: Stroke, i: number, w: number, h: number) {
  const a = s[i - 1];
  const b = s[i];
  ctx.beginPath();
  ctx.lineWidth = baseWidth(w) * b.w;
  if (i === 1) {
    ctx.moveTo(a.x * w, a.y * h);
    const m = mid(a, b);
    ctx.lineTo(m.x * w, m.y * h);
  } else {
    const m0 = mid(s[i - 2], a);
    const m1 = mid(a, b);
    ctx.moveTo(m0.x * w, m0.y * h);
    ctx.quadraticCurveTo(a.x * w, a.y * h, m1.x * w, m1.y * h);
  }
  ctx.stroke();
}

function drawTail(ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number) {
  const n = s.length;
  if (n === 1) {
    ctx.beginPath();
    ctx.arc(s[0].x * w, s[0].y * h, (baseWidth(w) * s[0].w) / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const m = mid(s[n - 2], s[n - 1]);
  ctx.beginPath();
  ctx.lineWidth = baseWidth(w) * s[n - 1].w;
  ctx.moveTo(m.x * w, m.y * h);
  ctx.lineTo(s[n - 1].x * w, s[n - 1].y * h);
  ctx.stroke();
}

function drawTyped(ctx: CanvasRenderingContext2D, name: string, w: number, h: number) {
  const font = scriptFont();
  let size = h * 0.5;
  ctx.font = `400 ${size}px ${font}`;
  while (size > 12 && ctx.measureText(name).width > w * 0.86) {
    size -= 2;
    ctx.font = `400 ${size}px ${font}`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(name, w / 2, h * 0.68);
}

/** Clears and paints the whole pad (strokes, or the typed name when `typed` is a string). */
function paint(ctx: CanvasRenderingContext2D, w: number, h: number, ink: string, strokes: Stroke[], typed: string | null) {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (typed !== null) {
    if (typed) drawTyped(ctx, typed, w, h);
    return;
  }
  for (const s of strokes) {
    for (let i = 1; i < s.length; i++) drawSegment(ctx, s, i, w, h);
    drawTail(ctx, s, w, h);
  }
}

function exportPng(ink: string, strokes: Stroke[], typed: string | null): string {
  const c = document.createElement("canvas");
  c.width = EXPORT_W;
  c.height = EXPORT_H;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  paint(ctx, EXPORT_W, EXPORT_H, ink, strokes, typed);
  return c.toDataURL("image/png");
}

/**
 * Signature field: draw with a finger, mouse or pen (pointer events), or tick "Use my typed name
 * instead" to render `name` in a script style (the keyboard and screen-reader route).
 * `onChange` receives a compact PNG data URL, or null while the pad is empty.
 * The element with `id` takes focus from an error summary.
 */
export function SignaturePad({ id, label, name, onChange, error, className }: { id: string; label: string; name: string; onChange: (dataUrl: string | null) => void; error?: string; className?: string }) {
  const t = useT("agreement");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const active = useRef<number | null>(null);
  const size = useRef({ w: 0, h: 0 });
  const typedRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  const [typed, setTyped] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [live, setLive] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Size the backing store to the element × devicePixelRatio and repaint (also after <Activity> re-shows the route).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      size.current = { w: rect.width, h: rect.height };
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(ctx, rect.width, rect.height, inkColour(canvas), strokes.current, typedRef.current);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Typed mode: render the name and report it whenever it changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    typedRef.current = typed ? name.trim() : null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ink = inkColour(canvas);
    const render = () => {
      if (ctx) paint(ctx, size.current.w, size.current.h, ink, strokes.current, typedRef.current);
      if (typed) onChangeRef.current(name.trim() ? exportPng(ink, [], name.trim()) : null);
    };
    render();
    // The script face isn't preloaded: draw again once it has arrived.
    let cancelled = false;
    const family = signatureFamily();
    if (typed && family && document.fonts) void document.fonts.load(`48px ${family}`).then(() => !cancelled && render(), () => undefined);
    return () => {
      cancelled = true;
    };
  }, [typed, name]);

  const point = (e: PointerEvent, canvas: HTMLCanvasElement): Point => {
    const r = canvas.getBoundingClientRect();
    const pressure = e.pointerType === "pen" && e.pressure > 0 ? 0.55 + e.pressure * 0.9 : 1;
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)), w: pressure };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (typed || active.current !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    const canvas = e.currentTarget;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    active.current = e.pointerId;
    strokes.current.push([point(e.nativeEvent, canvas)]);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (active.current !== e.pointerId) return;
    const canvas = e.currentTarget;
    const ctx = canvas.getContext("2d");
    const s = strokes.current[strokes.current.length - 1];
    if (!ctx || !s) return;
    const { w, h } = size.current;
    ctx.strokeStyle = inkColour(canvas);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const p = point(ev, canvas);
      const last = s[s.length - 1];
      if (Math.hypot((p.x - last.x) * w, (p.y - last.y) * h) < 1.5) continue;
      s.push(p);
      drawSegment(ctx, s, s.length - 1, w, h);
    }
  };

  const finish = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (active.current !== e.pointerId) return;
    active.current = null;
    const canvas = e.currentTarget;
    const ctx = canvas.getContext("2d");
    const s = strokes.current[strokes.current.length - 1];
    const ink = inkColour(canvas);
    if (ctx && s) {
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;
      drawTail(ctx, s, size.current.w, size.current.h);
    }
    if (!drawn) setLive(t("signature.added"));
    setDrawn(true);
    onChangeRef.current(exportPng(ink, strokes.current, null));
  };

  const clear = () => {
    strokes.current = [];
    setDrawn(false);
    setLive("");
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) paint(ctx, size.current.w, size.current.h, inkColour(canvas), [], null);
    onChangeRef.current(null);
  };

  const toggleTyped = (v: boolean) => {
    strokes.current = [];
    setDrawn(false);
    setTyped(v);
    if (!v) onChangeRef.current(null);
  };

  const filled = typed ? name.trim().length > 0 : drawn;
  const hintId = `${id}-hint`;

  return (
    <div className={clsx("field", className)}>
      <p id={`${id}-label`} className="field-label">{label}</p>
      <p id={hintId} className="field-hint">{typed ? t("signature.typedInstructions") : t("signature.instructions")}</p>
      <div
        id={id}
        tabIndex={-1}
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={[hintId, error ? `${id}-error` : ""].filter(Boolean).join(" ")}
        className={clsx("relative w-full max-w-[560px] overflow-hidden rounded-xl border bg-card", error ? "border-danger" : "border-input")}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={filled ? t("signature.filled") : t("signature.empty")}
          className={clsx("block aspect-[16/7] w-full touch-none select-none text-fg", typed ? "cursor-default" : "cursor-crosshair")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finish}
          onPointerCancel={finish}
          onLostPointerCapture={finish}
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-[6%] top-[74%] border-t border-dashed border-line" />
        <span aria-hidden="true" className="pointer-events-none absolute start-[6%] top-[74%] -translate-y-[115%] text-lg leading-none text-muted">×</span>
      </div>
      <div className="flex max-w-[560px] flex-wrap items-start justify-between gap-x-4">
        <Checkbox id={`${id}-typed`} checked={typed} onChange={toggleTyped}>{t("signature.useTyped")}</Checkbox>
        {!typed && (
          <button type="button" className="btn btn-ghost btn-sm gap-2" onClick={clear} disabled={!drawn}>
            <Eraser className="h-4 w-4" aria-hidden="true" />
            {t("signature.clear")}
          </button>
        )}
      </div>
      {typed && !name.trim() && <p className="field-hint">{t("signature.needName")}</p>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
      <p className="sr-only" role="status">{live}</p>
    </div>
  );
}

/** A stored signature image: fg ink on the card surface on screen, black ink on white in print. */
export function SignatureImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={clsx("w-full max-w-[320px] rounded-xl border border-line bg-bg/40 p-1 print:border-neutral-300 print:bg-white", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the signature pad */}
      <img src={src} alt={alt} width={EXPORT_W} height={EXPORT_H} className="block h-auto w-full print:brightness-0" />
    </div>
  );
}
