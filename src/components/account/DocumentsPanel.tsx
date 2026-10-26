"use client";

import clsx from "clsx";
import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { Check, CircleCheck, CircleX, Clock3, FileImage, FileText, ImageUp, Trash2, Upload, X } from "lucide-react";
import { useHref, useLocale, useT } from "@/i18n/client";
import {
  ACCEPTED_TYPES,
  documentFor,
  documentProgress,
  fileProblem,
  removeDocument,
  requiredDocuments,
  reviewDocument,
  uploadDocument,
  giveDocumentConsent,
  useDocumentConsent,
  useDocuments,
  withdrawDocumentConsent,
  type CustomerDocument,
  type DocKind,
  type DocRequirement,
  type DocSide,
} from "@/lib/customer/store";
import { Checkbox, FieldError } from "@/components/booking/Field";
import { Rich } from "@/components/content/Rich";
import { useHydrated } from "@/components/booking/hooks";
import { needsIdp } from "@/components/booking/lib";
import { Notice } from "@/components/ui";
import { canPreview, fileInfo, formatBytes, stamp } from "./format";

// Driver documents: one slot per side, upload (customer) or verify/reject (ops).
// Demo: files never leave the page. The store keeps the name, type and size only; image
// previews are object URLs held by each slot and revoked on replace and unmount.

export interface DocumentsPanelProps {
  /** E.164 phone the documents are kept with (the account key, or a booking's driver phone). */
  phone: string;
  driver: { resident?: boolean; licenceCountry?: string };
  mode?: "customer" | "ops";
  headingLevel?: "h2" | "h3";
  className?: string;
}

type T = (key: string, vars?: Record<string, string | number>) => string;
type SlotState = "missing" | "uploading" | "uploaded" | "verified" | "rejected";
type Say = (text: string) => void;
type UploadError = "type" | "size" | "many" | "failed";

// HEIC/HEIF extensions too: some desktop browsers don't map the MIME type. No `capture`
// attribute, so phones offer the camera, the photo library and files.
const ACCEPT = [...ACCEPTED_TYPES, ".heic", ".heif"].join(",");
const REASONS = ["blurry", "expired", "name", "wrong", "other"] as const;
type Reason = (typeof REASONS)[number];

const focusRing = "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring";

function slotName(t: T, kind: DocKind, side: DocSide, locale?: string): string {
  const doc = t(`docs.kinds.${kind}`);
  return side === "page" ? doc : t("docs.slotName", { doc, side: t(`docs.sides.${side}`).toLocaleLowerCase(locale) });
}

/** Why ops rejected a file, in the viewer's language when it is a listed reason. */
function reasonText(t: T, doc: CustomerDocument): string {
  if (doc.reviewReason && doc.reviewReason !== "other") {
    const key = `docs.ops.reasons.${doc.reviewReason}`;
    const text = t(key);
    if (text !== key) return text;
  }
  return doc.reviewNote ?? "";
}

/** What changed between two snapshots of one driver's documents, as sentences for screen readers. */
function describeChanges(t: T, required: DocRequirement[], before: CustomerDocument[], after: CustomerDocument[], locale?: string): string {
  const out: string[] = [];
  for (const r of required) {
    for (const side of r.sides) {
      const a = documentFor(before, r.kind, side);
      const b = documentFor(after, r.kind, side);
      const slot = slotName(t, r.kind, side, locale);
      if (a && !b) out.push(t("docs.say.removed", { slot }));
      else if (b && (!a || a.id !== b.id)) out.push(t("docs.say.uploaded", { slot }));
      else if (a && b && a.status !== b.status) {
        if (b.status === "verified") out.push(t("docs.say.verified", { slot }));
        else if (b.status === "rejected") out.push(t("docs.say.rejected", { slot, reason: reasonText(t, b) }).trim());
        else out.push(t("docs.say.review", { slot }));
      }
    }
  }
  return out.join(" ");
}

/** The consent label with the Privacy Notice linked (the linked message, or the plain one while a translation is missing). */
function consentText(t: T): string {
  const linked = t("docs.consentLabelLinked");
  if (linked !== "docs.consentLabelLinked") return linked;
  return t("docs.consentLabel").replace("Privacy Notice", "[Privacy Notice](/legal/privacy)");
}

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

export function DocumentsPanel({ phone, driver, mode = "customer", headingLevel = "h2", className }: DocumentsPanelProps) {
  const t = useT("account");
  const locale = useLocale();
  const hydrated = useHydrated();
  const docs = useDocuments(phone || undefined);
  const required = requiredDocuments(driver, needsIdp);
  const progress = documentProgress(docs, required);
  const headingId = useId();
  const formatsId = useId();
  const ops = mode === "ops";
  const consent = useDocumentConsent(phone || undefined);
  const href = useHref();
  const H = headingLevel;
  const G = headingLevel === "h2" ? "h3" : "h4";

  // One polite live region for every change: this panel's actions, and uploads or reviews
  // made elsewhere (another tab, the ops desk). Changes are found by comparing snapshots.
  const [said, setSaid] = useState({ text: "", n: 0 });
  const say = useCallback<Say>((text) => setSaid((s) => ({ text, n: s.n + 1 })), []);
  const [seen, setSeen] = useState<{ phone: string; docs: CustomerDocument[] } | null>(null);
  if (hydrated && (seen?.phone !== phone || seen.docs !== docs)) {
    const text = seen && seen.phone === phone ? describeChanges(t, required, seen.docs, docs, locale) : "";
    setSeen({ phone, docs });
    if (text) setSaid((s) => ({ text, n: s.n + 1 }));
  }

  // A file dropped beside a slot would open in the tab and leave the page: swallow it.
  useEffect(() => {
    if (ops) return;
    const guard = (e: globalThis.DragEvent) => {
      if (e.defaultPrevented || !e.dataTransfer || !Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "none";
    };
    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    return () => {
      window.removeEventListener("dragover", guard);
      window.removeEventListener("drop", guard);
    };
  }, [ops]);

  const pct = progress.total ? Math.round((progress.uploaded / progress.total) * 100) : 0;
  const rejectedNote = progress.rejected ? ` · ${t(ops ? "docs.progressRejectedOps" : "docs.progressRejected", { n: progress.rejected })}` : "";

  return (
    <section aria-labelledby={headingId} className={clsx("@container grid min-w-0 content-start gap-5", className)}>
      <header className="grid gap-2">
        <H id={headingId} className={headingLevel === "h2" ? "display-sm" : "text-[15px] font-semibold"}>
          {t(`docs.title.${mode}`)}
        </H>
        <p className="max-w-[62ch] text-sm leading-relaxed text-champagne">{t(`docs.intro.${mode}`)}</p>
      </header>

      {!phone ? (
        <Notice tone="warning">{t("docs.noPhone")}</Notice>
      ) : (
        <>
          <div className="grid gap-2">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold tabular">
              {progress.allVerified ? (
                <>
                  <CircleCheck className="h-4 w-4 text-success" aria-hidden="true" />
                  {t("docs.allVerified")}
                </>
              ) : (
                `${t("docs.progress", { uploaded: progress.uploaded, total: progress.total, verified: progress.verified })}${rejectedNote}`
              )}
            </p>
            <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className={clsx("h-full rounded-full transition-[width] duration-300", progress.allVerified ? "bg-success" : "bg-accent")} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {!ops && <p id={formatsId} className="field-hint -mt-1">{t("docs.formats")}</p>}

          {!ops && (
            consent ? (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                {t("docs.consentGiven", { when: stamp(consent, locale) })}
                <button type="button" className="btn btn-ghost btn-sm -ms-3 text-muted" onClick={() => void withdrawDocumentConsent(phone).then(() => say(t("docs.consentWithdrawn")))}>
                  {t("docs.consentWithdraw")}
                </button>
              </p>
            ) : (
              <Checkbox id={`${headingId}-consent`} checked={false} onChange={(v) => v && giveDocumentConsent(phone)}>
                <Rich text={consentText(t)} href={href} />
              </Checkbox>
            )
          )}

          {!ops && !consent ? (
            <p className="text-sm text-champagne">{t("docs.consentNeeded")}</p>
          ) : (
          <ul className="m-0 grid list-none gap-4 p-0">
            {required.map((r) => {
              const done = r.sides.filter((s) => {
                const d = documentFor(docs, r.kind, s);
                return d && d.status !== "rejected";
              }).length;
              return (
                <li key={r.kind} className="card grid min-w-0 gap-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <G className="text-[15px] font-semibold leading-snug">{t(`docs.kinds.${r.kind}`)}</G>
                    {r.sides.length > 1 && <p className="text-[12px] tabular text-muted">{t("docs.sidesDone", { done, total: r.sides.length })}</p>}
                  </div>
                  <ul className={clsx("m-0 grid list-none gap-3 p-0", r.sides.length > 1 && "@xl:grid-cols-2")}>
                    {r.sides.map((side) => {
                      const slot = { kind: r.kind, side, doc: documentFor(docs, r.kind, side), phone, say, label: t(`docs.sides.${side}`), name: slotName(t, r.kind, side, locale) };
                      return ops ? <OpsSlot key={side} {...slot} /> : <CustomerSlot key={side} {...slot} formatsId={formatsId} />;
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
          )}
        </>
      )}

      {/* Alternating no-break space: the same message twice in a row is still announced. */}
      <p role="status" className="sr-only">
        {said.text}
        {said.n % 2 ? " " : ""}
      </p>
    </section>
  );
}

/* ---------- pieces ---------- */

interface SlotProps {
  kind: DocKind;
  side: DocSide;
  doc?: CustomerDocument;
  phone: string;
  say: Say;
  /** Visible side label ("Front"). */
  label: string;
  /** Full name for announcements and button labels ("Driving licence, front"). */
  name: string;
}

const badgeTone: Record<SlotState, string> = {
  missing: "badge-muted",
  uploading: "border-info/50 text-info",
  uploaded: "border-info/50 text-info",
  verified: "border-success/50 text-success",
  rejected: "border-danger/60 text-danger",
};
const badgeIcon = { missing: null, uploading: null, uploaded: Clock3, verified: CircleCheck, rejected: CircleX } as const;

/** Status as text in a badge (never colour alone). */
function DocBadge({ state }: { state: SlotState }) {
  const t = useT("account");
  const Icon = badgeIcon[state];
  return (
    <span className={clsx("badge", badgeTone[state])}>
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {t(`docs.status.${state}`)}
    </span>
  );
}

const Spinner = ({ className }: { className?: string }) => (
  <span className={clsx("h-4 w-4 flex-none animate-spin rounded-full border-2 border-current border-e-transparent", className)} aria-hidden="true" />
);

function Thumb({ state, type, preview, onBroken }: { state: SlotState; type?: string; preview?: string; onBroken?: () => void }) {
  const Icon = state === "missing" ? ImageUp : type === "application/pdf" ? FileText : FileImage;
  return (
    <div className={clsx("relative grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-lg border", state === "missing" ? "border-dashed border-input text-muted" : "border-line bg-elevated text-champagne")}>
      {preview ? <Image src={preview} alt="" width={56} height={56} className="h-full w-full object-cover" onError={onBroken} /> : <Icon className="h-6 w-6" aria-hidden="true" />}
      {state === "uploading" && (
        <span className="absolute inset-0 grid place-items-center bg-bg/60 text-fg">
          <Spinner className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}

const slotBox = (state: SlotState, active?: boolean) =>
  clsx("grid min-w-0 content-start gap-3 rounded-xl border p-3 transition-colors duration-200", active ? "border-accent bg-elevated" : state === "missing" ? "border-dashed border-line" : "border-line bg-bg/40");

function FileMeta({ name, size, when, t }: { name: string; size: number; when?: string; t: T }) {
  const locale = useLocale();
  return (
    <>
      <p className="text-[13px] text-champagne [overflow-wrap:anywhere]">
        <bdi>{name}</bdi> · <span className="tabular">{formatBytes(size, locale)}</span>
      </p>
      {when && <p className="text-[12px] tabular text-muted">{t("docs.uploadedAt", { when: stamp(when, locale) })}</p>}
    </>
  );
}

/** Customer slot: a labelled file input, drag-and-drop, inline checks, preview, Replace and Remove. */
function CustomerSlot({ kind, side, doc, phone, say, label, name, formatsId }: SlotProps & { formatsId: string }) {
  const t = useT("account");
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; size: number; type: string } | null>(null);
  const [preview, setPreview] = useState<{ url: string; docId?: string } | null>(null);
  const [broken, setBroken] = useState<string | null>(null);
  const [error, setError] = useState<UploadError | null>(null);
  const [removing, setRemoving] = useState(false);
  const [dragging, setDragging] = useState(false);

  // The object URL this slot owns: revoked when replaced and when the slot unmounts.
  const held = useRef({ url: "" });
  const hold = (file?: File) => {
    if (held.current.url) URL.revokeObjectURL(held.current.url);
    held.current.url = file ? URL.createObjectURL(file) : "";
    return held.current.url;
  };
  useEffect(() => {
    const h = held.current;
    return () => {
      if (h.url) URL.revokeObjectURL(h.url);
      h.url = "";
    };
  }, []);

  const uploading = pending !== null;
  const state: SlotState = uploading ? "uploading" : doc ? doc.status : "missing";
  const showPreview = preview && preview.url !== broken && (uploading ? !preview.docId : preview.docId === doc?.id) ? preview.url : undefined;

  const fail = (problem: UploadError) => {
    setError(problem);
    say(t("docs.say.error", { slot: name, error: t(`docs.errors.${problem}`) }));
  };

  const upload = async (file: File) => {
    if (uploading || removing) return;
    const info = fileInfo(file);
    const problem = fileProblem(info);
    if (problem) return fail(problem);
    setError(null);
    const url = canPreview(info.type) ? hold(file) : hold();
    setPreview(url ? { url } : null);
    setPending({ name: info.name, size: info.size, type: info.type });
    say(t("docs.say.uploading", { slot: name }));
    try {
      const saved = await uploadDocument(phone, kind, side, info);
      setPreview(url ? { url, docId: saved.id } : null);
    } catch {
      hold();
      setPreview(null);
      fail("failed");
    } finally {
      setPending(null);
    }
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // the same file can be chosen again after a fix
    if (file) void upload(file);
  };

  const remove = async () => {
    if (!doc || removing || uploading) return;
    setRemoving(true);
    try {
      await removeDocument(phone, doc.id);
      hold();
      setPreview(null);
      setError(null);
      inputRef.current?.focus(); // the Remove button is gone: keep focus in this slot
    } catch {
      fail("failed");
    } finally {
      setRemoving(false);
    }
  };

  const onDragOver = (e: DragEvent<HTMLLIElement>) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = uploading ? "none" : "copy";
    if (!dragging) setDragging(true);
  };
  const onDragLeave = (e: DragEvent<HTMLLIElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragging(false);
  };
  const onDrop = (e: DragEvent<HTMLLIElement>) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 1) return fail("many");
    const file = e.dataTransfer.files[0];
    if (file) void upload(file);
  };

  const needsFile = state === "missing" || state === "rejected";
  const pickText = uploading ? t("docs.status.uploading") : state === "missing" ? t("docs.add") : state === "rejected" ? t("docs.again") : t("docs.replace");

  return (
    <li aria-busy={uploading || removing || undefined} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className={slotBox(state, dragging)}>
      <div className="flex items-start gap-3">
        <Thumb state={state} type={pending?.type ?? doc?.fileType} preview={showPreview} onBroken={() => setBroken(showPreview ?? null)} />
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{label}</p>
            <DocBadge state={state} />
          </div>
          {pending ? <FileMeta name={pending.name} size={pending.size} t={t} /> : doc ? <FileMeta name={doc.fileName} size={doc.fileSize} when={doc.uploadedAt} t={t} /> : <p className="text-[13px] text-muted">{t("docs.notYet")}</p>}
          {state === "rejected" && doc && reasonText(t, doc) && <p className="text-[13px] font-semibold text-danger">{t("docs.reason", { reason: reasonText(t, doc) })}</p>}
          <FieldError id={errorId}>{error ? t(`docs.errors.${error}`) : undefined}</FieldError>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className={clsx("btn btn-sm relative", needsFile ? "btn-primary" : "btn-secondary", focusRing, uploading ? "cursor-progress opacity-70" : "cursor-pointer")}>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={onPick}
            onClick={(e) => {
              if (uploading || removing) e.preventDefault();
            }}
            aria-label={t("docs.action", { action: pickText, slot: name })}
            aria-disabled={uploading || removing || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={[formatsId, error ? errorId : ""].filter(Boolean).join(" ")}
          />
          {uploading ? <Spinner /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          {pickText}
        </label>
        {state === "missing" && <span className={clsx("hidden text-[13px] pointer-fine:inline", dragging ? "font-semibold text-fg" : "text-muted")}>{dragging ? t("docs.dropHere") : t("docs.drop")}</span>}
        {doc && !uploading && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void remove()} aria-busy={removing || undefined} aria-label={t("docs.action", { action: t("docs.remove"), slot: name })}>
            {removing ? <Spinner /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
            {t("docs.remove")}
          </button>
        )}
      </div>
    </li>
  );
}

/** Ops slot: file details and Verify / Reject (with a reason the customer sees). */
function OpsSlot({ doc, phone, say, label, name }: SlotProps) {
  const t = useT("account");
  const uid = useId();
  const rejectRef = useRef<HTMLButtonElement>(null);
  const firstReasonRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"verified" | "rejected" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<Reason | "">("");
  const [other, setOther] = useState("");
  const [formError, setFormError] = useState<"reason" | "other" | null>(null);
  const [failed, setFailed] = useState(false);
  const state: SlotState = doc ? doc.status : "missing";

  useEffect(() => {
    if (rejecting) firstReasonRef.current?.focus();
  }, [rejecting]);

  const review = async (status: "verified" | "rejected", note?: string, reasonId?: Reason) => {
    if (!doc || busy) return;
    setBusy(status);
    setFailed(false);
    try {
      await reviewDocument(phone, doc.id, status, note, reasonId);
      if (status === "rejected") {
        setRejecting(false);
        rejectRef.current?.focus();
      }
    } catch {
      setFailed(true);
      say(t("docs.say.error", { slot: name, error: t("docs.errors.failed") }));
    } finally {
      setBusy(null);
    }
  };

  const openReject = () => {
    setReason("");
    setOther("");
    setFormError(null);
    setRejecting(true);
  };
  const closeReject = () => {
    setRejecting(false);
    rejectRef.current?.focus();
  };
  const confirmReject = () => {
    if (!reason) {
      setFormError("reason");
      firstReasonRef.current?.focus();
      return;
    }
    const note = reason === "other" ? other.trim() : t(`docs.ops.reasons.${reason}`);
    if (!note) {
      setFormError("other");
      otherRef.current?.focus();
      return;
    }
    void review("rejected", note, reason);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLFieldSetElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closeReject();
    }
  };

  const reasonErrorId = `${uid}-reason-error`;
  const otherId = `${uid}-other`;

  return (
    <li aria-busy={busy ? true : undefined} className={slotBox(state)}>
      <div className="flex items-start gap-3">
        <Thumb state={state} type={doc?.fileType} />
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{label}</p>
            <DocBadge state={state} />
          </div>
          {doc ? <FileMeta name={doc.fileName} size={doc.fileSize} when={doc.uploadedAt} t={t} /> : <p className="text-[13px] text-muted">{t("docs.notYet")}</p>}
          {doc?.status === "rejected" && reasonText(t, doc) && <p className="text-[13px] font-semibold text-danger">{t("docs.reason", { reason: reasonText(t, doc) })}</p>}
          <FieldError id={`${uid}-error`}>{failed ? t("docs.errors.failed") : undefined}</FieldError>
        </div>
      </div>

      {doc && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            aria-label={t("docs.action", { action: t("docs.ops.verify"), slot: name })}
            aria-disabled={doc.status === "verified" || undefined}
            aria-busy={busy === "verified" || undefined}
            onClick={() => {
              if (doc.status !== "verified") void review("verified");
            }}
          >
            {busy === "verified" ? <Spinner /> : <Check className="h-4 w-4" aria-hidden="true" />}
            {t("docs.ops.verify")}
          </button>
          <button ref={rejectRef} type="button" className="btn btn-ghost btn-sm" aria-label={t("docs.action", { action: t("docs.ops.reject"), slot: name })} aria-expanded={rejecting} aria-controls={rejecting ? `${uid}-reject` : undefined} onClick={() => (rejecting ? closeReject() : openReject())}>
            <X className="h-4 w-4" aria-hidden="true" />
            {t("docs.ops.reject")}
          </button>
        </div>
      )}

      {doc && rejecting && (
        <fieldset id={`${uid}-reject`} onKeyDown={onKeyDown} className="m-0 grid min-w-0 gap-2 rounded-xl border border-line bg-card p-3">
          <legend className="float-start mb-1 w-full p-0 text-[13px] font-semibold text-fg">
            {t("docs.ops.reasonLegend")}
            <span className="sr-only normal-case"> ({name})</span>
          </legend>
          <div className="grid gap-0.5">
            {REASONS.map((r, i) => (
              <label key={r} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-champagne hover:bg-elevated">
                <input
                  ref={i === 0 ? firstReasonRef : undefined}
                  type="radio"
                  name={`${uid}-reason`}
                  value={r}
                  checked={reason === r}
                  onChange={() => {
                    setReason(r);
                    setFormError(null);
                  }}
                  className="h-4 w-4 flex-none cursor-pointer accent-accent"
                  aria-describedby={formError === "reason" ? reasonErrorId : undefined}
                />
                {t(`docs.ops.reasons.${r}`)}
              </label>
            ))}
          </div>
          <FieldError id={reasonErrorId}>{formError === "reason" ? t("docs.ops.reasonError") : undefined}</FieldError>
          {reason === "other" && (
            <div className="field">
              <label htmlFor={otherId}>{t("docs.ops.otherLabel")}</label>
              <input
                ref={otherRef}
                id={otherId}
                className="input"
                value={other}
                maxLength={160}
                onChange={(e) => {
                  setOther(e.target.value);
                  setFormError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmReject();
                  }
                }}
                aria-invalid={formError === "other" ? true : undefined}
                aria-describedby={formError === "other" ? `${otherId}-error` : undefined}
              />
              <FieldError id={`${otherId}-error`}>{formError === "other" ? t("docs.ops.otherError") : undefined}</FieldError>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className="btn btn-primary btn-sm" onClick={confirmReject} aria-busy={busy === "rejected" || undefined}>
              {busy === "rejected" && <Spinner />}
              {t("docs.ops.confirm")}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeReject}>
              {t("docs.ops.cancel")}
            </button>
          </div>
        </fieldset>
      )}
    </li>
  );
}
