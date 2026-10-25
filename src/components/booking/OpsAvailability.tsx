"use client";

import { useState, type FormEvent } from "react";
import { CalendarX2, Trash2 } from "lucide-react";
import { cars, getCar } from "@/content/cars";
import { useLocale, useT } from "@/i18n/client";
import { addBlock, removeBlock, useBlocks, type BlockReason } from "@/lib/booking/availability";
import { addDays, todayInDubai } from "@/lib/dates";
import { busyRange } from "./Availability";
import { Field, describedBy } from "./Field";

const REASONS: BlockReason[] = ["maintenance", "owner", "event", "other"];

/**
 * Ops desk: take a car off the website for maintenance, owner use or an event. Blocked days
 * are crossed out in every calendar, and requests or confirmations that overlap them are stopped.
 */
export function OpsAvailability({ onSaved }: { onSaved: (message: string) => void }) {
  const t = useT("booking");
  const locale = useLocale();
  const blocks = useBlocks();
  const today = todayInDubai();
  const [carSlug, setCarSlug] = useState(cars[0].slug);
  const [from, setFrom] = useState(addDays(today, 1));
  const [to, setTo] = useState(addDays(today, 1));
  const [reason, setReason] = useState<BlockReason>("maintenance");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const upcoming = blocks.filter((b) => b.to >= today);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!from || !to || to < from || from < today) {
      setError(t("ops.blocks.errorDates"));
      return;
    }
    setError("");
    const block = addBlock({ carSlug, from, to, reason, note: note.trim() || undefined });
    setNote("");
    onSaved(t("ops.blocks.saved", { car: getCar(block.carSlug)?.name ?? block.carSlug, range: busyRange({ ...block, kind: "block" }, locale) }));
  };

  return (
    <details className="group card">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 font-semibold">
          <CalendarX2 className="h-4 w-4 text-accent" aria-hidden="true" />
          {t("ops.blocks.title")}
        </span>
        <span className="text-sm text-muted tabular">{t("ops.blocks.count", { n: upcoming.length })}</span>
      </summary>
      <div className="grid gap-6 border-t border-line p-5">
        <p className="max-w-[68ch] text-sm text-champagne">{t("ops.blocks.lede")}</p>
        {upcoming.length > 0 && (
          <ul className="m-0 grid list-none gap-2 p-0">
            {upcoming.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-2">
                <span className="grid">
                  <span className="font-semibold">{getCar(b.carSlug)?.name ?? b.carSlug}</span>
                  <span className="text-[13px] text-muted tabular">
                    {busyRange({ ...b, kind: "block" }, locale)} · {t(`ops.blocks.reasons.${b.reason}`)}{b.note ? <> · <bdi>{b.note}</bdi></> : null}
                  </span>
                </span>
                <button type="button" className="btn btn-ghost btn-sm gap-2" onClick={() => { removeBlock(b.id); onSaved(t("ops.blocks.removed")); }} aria-label={t("ops.blocks.removeLabel", { car: getCar(b.carSlug)?.name ?? b.carSlug })}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t("ops.blocks.remove")}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form noValidate onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <Field id="block-car" label={t("ops.blocks.car")}>
            <select id="block-car" className="input" value={carSlug} onChange={(e) => setCarSlug(e.target.value)}>
              {cars.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </Field>
          <Field id="block-from" label={t("ops.blocks.from")} error={error}>
            <input id="block-from" type="date" className="input tabular" min={today} value={from} onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value); }} aria-invalid={error ? true : undefined} aria-describedby={describedBy("block-from", undefined, error)} />
          </Field>
          <Field id="block-to" label={t("ops.blocks.to")}>
            <input id="block-to" type="date" className="input tabular" min={from || today} value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field id="block-reason" label={t("ops.blocks.reason")}>
            <select id="block-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value as BlockReason)}>
              {REASONS.map((r) => <option key={r} value={r}>{t(`ops.blocks.reasons.${r}`)}</option>)}
            </select>
          </Field>
          <Field id="block-note" label={t("ops.blocks.note")} optional className="sm:col-span-2 lg:col-span-3">
            <input id="block-note" className="input" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary btn-block">{t("ops.blocks.add")}</button>
          </div>
        </form>
      </div>
    </details>
  );
}
