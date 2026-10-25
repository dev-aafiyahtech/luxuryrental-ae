"use client";

import { useSyncExternalStore } from "react";
import type { DriverDetails } from "@/lib/booking/types";

// SIMULATED BACKEND for customer accounts and document uploads. Everything is kept in this
// browser's localStorage. The functions mirror the planned API (one-time sign-in codes over
// WhatsApp or email, document upload to private storage, ops review), so the UI won't change
// when the real backend replaces this file.
//
// Privacy in the demo: uploaded files are NEVER stored or sent. Only the file name, type and
// size are kept; a preview lives in memory for the current page only.

/* ---------- types ---------- */

export type DocKind = "passport" | "visa" | "licence" | "idp" | "emirates-id" | "uae-licence";
export type DocStatus = "uploaded" | "verified" | "rejected";
export type DocSide = "front" | "back" | "page";

export interface CustomerDocument {
  id: string;
  kind: DocKind;
  side: DocSide;
  fileName: string;
  fileType: string;
  fileSize: number; // bytes
  uploadedAt: string;
  status: DocStatus;
  reviewedAt?: string;
  reviewNote?: string; // reason when rejected, as written
  /** Reason id when rejected for a listed reason ("blurry", "expired"…), so the customer sees it in their language. */
  reviewReason?: string;
}

/** One document the driver must provide, with the sides it needs. */
export interface DocRequirement {
  kind: DocKind;
  sides: DocSide[];
}

export interface CustomerProfile {
  name: string;
  phone: string; // E.164, the account key
  email?: string;
  licenceCountry: string;
  resident: boolean;
  ageBand: DriverDetails["ageBand"];
  createdAt: string;
}

export interface AccountState {
  signedIn: boolean;
  profile?: CustomerProfile;
}

/* ---------- storage ---------- */

const ACCOUNT_KEY = "lr.account.v1";
const DOCS_KEY = "lr.docs.v1";
const CODE_KEY = "lr.signin-code.v1";
const CONSENT_KEY = "lr.docs-consent.v1";
const LATENCY_MS = 600;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp", "application/pdf"];

type Listener = () => void;
const listeners = new Set<Listener>();
let accountCache: AccountState | null = null;
let docsCache: Record<string, CustomerDocument[]> | null = null;
let consentCache: Record<string, string> | null = null;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* blocked or full: keep the in-memory copy for this session */
  }
}

const emit = () => listeners.forEach((l) => l());
const SIGNED_OUT: AccountState = { signedIn: false };

function readAccount(): AccountState {
  if (!accountCache) accountCache = readJSON<AccountState>(ACCOUNT_KEY, SIGNED_OUT);
  return accountCache;
}

function writeAccount(next: AccountState) {
  accountCache = next;
  writeJSON(ACCOUNT_KEY, next);
  emit();
}

function readDocs(): Record<string, CustomerDocument[]> {
  if (!docsCache) docsCache = readJSON<Record<string, CustomerDocument[]>>(DOCS_KEY, {});
  return docsCache;
}

function writeDocs(next: Record<string, CustomerDocument[]>) {
  docsCache = next;
  writeJSON(DOCS_KEY, next);
  emit();
}

function readConsent(): Record<string, string> {
  if (!consentCache) consentCache = readJSON<Record<string, string>>(CONSENT_KEY, {});
  return consentCache;
}

function writeConsent(next: Record<string, string>) {
  consentCache = next;
  writeJSON(CONSENT_KEY, next);
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === ACCOUNT_KEY) accountCache = null;
    if (e.key === DOCS_KEY) docsCache = null;
    if (e.key === CONSENT_KEY) consentCache = null;
    if (e.key === ACCOUNT_KEY || e.key === DOCS_KEY || e.key === CONSENT_KEY) emit();
  });
}

export function subscribeCustomer(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const wait = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));
const id = () => {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
};

/** "+971 50 123 4567" or "+971501234567" → "+971501234567". Emails are lower-cased. */
export function normaliseContact(value: string): string {
  const v = value.trim();
  if (v.includes("@")) return v.toLowerCase();
  const digits = v.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits.replace(/^00/, "")}`;
}

/* ---------- account: one-time code sign-in ---------- */

/**
 * POST /api/auth/code: send a 6-digit code by WhatsApp (phone) or email.
 * Demo: nothing is sent; the code is returned so the page can show it.
 */
export async function requestSignInCode(contact: string): Promise<{ sentTo: string; channel: "whatsapp" | "email"; demoCode: string }> {
  await wait();
  const to = normaliseContact(contact);
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  const code = String(n[0] % 1_000_000).padStart(6, "0");
  try {
    sessionStorage.setItem(CODE_KEY, JSON.stringify({ to, code, at: Date.now() }));
  } catch {
    /* ignore */
  }
  return { sentTo: to, channel: to.includes("@") ? "email" : "whatsapp", demoCode: code };
}

/**
 * POST /api/auth/verify: check the code and sign in. A first sign-in creates the account,
 * pre-filled from the driver details already typed into the booking form.
 */
export async function verifySignInCode(contact: string, code: string, seed?: Partial<DriverDetails>): Promise<CustomerProfile> {
  await wait();
  const to = normaliseContact(contact);
  let pending: { to: string; code: string; at: number } | null = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(CODE_KEY) ?? "null");
  } catch {
    pending = null;
  }
  if (!pending || pending.to !== to) throw new Error("expired");
  if (Date.now() - pending.at > 10 * 60 * 1000) throw new Error("expired");
  if (pending.code !== code.trim()) throw new Error("wrong");
  try {
    sessionStorage.removeItem(CODE_KEY);
  } catch {
    /* ignore */
  }
  const existing = readAccount().profile;
  const sameUser = existing && (existing.phone === to || existing.email === to);
  const profile: CustomerProfile = sameUser
    ? existing
    : {
        name: seed?.name ?? "",
        phone: to.includes("@") ? seed?.phone ?? "" : to,
        email: to.includes("@") ? to : seed?.email,
        licenceCountry: seed?.licenceCountry ?? "AE",
        resident: seed?.resident ?? false,
        ageBand: seed?.ageBand ?? "30+",
        createdAt: new Date().toISOString(),
      };
  writeAccount({ signedIn: true, profile });
  return profile;
}

export function signOut() {
  const cur = readAccount();
  writeAccount({ ...cur, signedIn: false });
}

/** PATCH /api/account: update the profile. */
export async function updateProfile(patch: Partial<Omit<CustomerProfile, "createdAt">>): Promise<CustomerProfile> {
  await wait(400);
  const cur = readAccount();
  if (!cur.profile) throw new Error("Not signed in");
  const profile = { ...cur.profile, ...patch };
  // Documents and consent are kept per phone number: carry them over to a new number.
  const from = cur.profile.phone, to = profile.phone;
  if (from && to && from !== to) {
    const docs = { ...readDocs() };
    if (docs[from]) {
      docs[to] = [...(docs[to] ?? []), ...docs[from]];
      delete docs[from];
      writeDocs(docs);
    }
    const consent = { ...readConsent() };
    if (consent[from] && !consent[to]) {
      consent[to] = consent[from];
      delete consent[from];
      writeConsent(consent);
    }
  }
  writeAccount({ ...cur, profile });
  return profile;
}

/** DELETE /api/account: remove the account and its documents from this browser. */
export async function deleteAccount(): Promise<void> {
  await wait(400);
  const phone = readAccount().profile?.phone;
  if (phone) {
    const docs = { ...readDocs() };
    delete docs[phone];
    writeDocs(docs);
    const consent = { ...readConsent() };
    delete consent[phone];
    writeConsent(consent);
  }
  writeAccount(SIGNED_OUT);
}

/* ---------- documents ---------- */

/** Documents the main driver must provide, from residency and licence country. */
export function requiredDocuments(driver: { resident?: boolean; licenceCountry?: string }, needsIdp: (country?: string) => boolean): DocRequirement[] {
  if (driver.resident) {
    return [
      { kind: "emirates-id", sides: ["front", "back"] },
      { kind: "uae-licence", sides: ["front", "back"] },
    ];
  }
  const list: DocRequirement[] = [
    { kind: "passport", sides: ["page"] },
    { kind: "visa", sides: ["page"] },
    { kind: "licence", sides: ["front", "back"] },
  ];
  if (needsIdp(driver.licenceCountry)) list.push({ kind: "idp", sides: ["page"] });
  return list;
}

export const listDocuments = (phone?: string): CustomerDocument[] => (phone ? readDocs()[phone] ?? [] : []);

/** The latest upload for one document side (re-uploads replace earlier ones). */
export const documentFor = (docs: CustomerDocument[], kind: DocKind, side: DocSide) =>
  docs.filter((d) => d.kind === kind && d.side === side).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];

/** Counts against the requirements: every side must be uploaded; verified when ops approved all. */
export function documentProgress(docs: CustomerDocument[], required: DocRequirement[]) {
  const slots = required.flatMap((r) => r.sides.map((side) => documentFor(docs, r.kind, side)));
  const total = slots.length;
  const uploaded = slots.filter((d) => d && d.status !== "rejected").length;
  const verified = slots.filter((d) => d?.status === "verified").length;
  const rejected = slots.filter((d) => d?.status === "rejected").length;
  return { total, uploaded, verified, rejected, complete: uploaded === total, allVerified: verified === total };
}

const EXT_TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif", pdf: "application/pdf" };

/** The file's type, from the browser or (when the browser gives none, e.g. HEIC on desktop) its extension. */
export const fileTypeOf = (file: { name?: string; type: string }) => file.type || EXT_TYPES[file.name?.split(".").pop()?.toLowerCase() ?? ""] || "";

/** Why a file can't be accepted, or null. */
export function fileProblem(file: { name?: string; type: string; size: number }): "type" | "size" | null {
  if (!ACCEPTED_TYPES.includes(fileTypeOf(file))) return "type";
  if (file.size > MAX_FILE_BYTES) return "size";
  return null;
}

/**
 * POST /api/documents: upload one side of a document to private storage for review.
 * Demo: only the file's name, type and size are kept. The file itself never leaves the page.
 */
export async function uploadDocument(phone: string, kind: DocKind, side: DocSide, file: { name: string; type: string; size: number }): Promise<CustomerDocument> {
  await wait(1100);
  const problem = fileProblem(file);
  if (problem) throw new Error(problem);
  if (!readConsent()[phone]) throw new Error("consent");
  const doc: CustomerDocument = { id: id(), kind, side, fileName: file.name, fileType: fileTypeOf(file), fileSize: file.size, uploadedAt: new Date().toISOString(), status: "uploaded" };
  const all = readDocs();
  const mine = (all[phone] ?? []).filter((d) => !(d.kind === kind && d.side === side));
  writeDocs({ ...all, [phone]: [...mine, doc] });
  return doc;
}

export async function removeDocument(phone: string, docId: string): Promise<void> {
  await wait(300);
  const all = readDocs();
  writeDocs({ ...all, [phone]: (all[phone] ?? []).filter((d) => d.id !== docId) });
}

/** Ops: verify or reject an uploaded document (with a reason the customer sees; `reviewReason` is its id when it is a listed one). */
export async function reviewDocument(phone: string, docId: string, status: "verified" | "rejected", reviewNote?: string, reviewReason?: string): Promise<void> {
  await wait(400);
  const all = readDocs();
  writeDocs({ ...all, [phone]: (all[phone] ?? []).map((d) => (d.id === docId ? { ...d, status, reviewNote, reviewReason, reviewedAt: new Date().toISOString() } : d)) });
}

/** Consent (plan C-03) to use uploaded documents for the eligibility check, given before the first upload. */
export function giveDocumentConsent(phone: string) {
  writeConsent({ ...readConsent(), [phone]: new Date().toISOString() });
}

/** Withdraw consent: removes the documents too. */
export async function withdrawDocumentConsent(phone: string): Promise<void> {
  await wait(300);
  const consent = { ...readConsent() };
  delete consent[phone];
  writeConsent(consent);
  const docs = { ...readDocs() };
  delete docs[phone];
  writeDocs(docs);
}

/** Clears every demo account and document in this browser. */
export function resetDemoCustomers() {
  writeAccount(SIGNED_OUT);
  writeDocs({});
  writeConsent({});
}

/* ---------- hooks ---------- */

const EMPTY_DOCS: CustomerDocument[] = [];
const EMPTY_ALL: Record<string, CustomerDocument[]> = {};

/** `{ signedIn, profile }`, live across tabs. Signed out until hydrated. */
export function useAccount(): AccountState {
  return useSyncExternalStore(subscribeCustomer, readAccount, () => SIGNED_OUT);
}

const EMPTY_CONSENT: Record<string, string> = {};

/** When consent to use uploaded documents was given for this phone, or undefined. */
export function useDocumentConsent(phone?: string): string | undefined {
  const all = useSyncExternalStore(subscribeCustomer, readConsent, () => EMPTY_CONSENT);
  return phone ? all[phone] : undefined;
}

/** Live documents for one phone number (the account key, or a booking's driver phone). */
export function useDocuments(phone?: string): CustomerDocument[] {
  const all = useSyncExternalStore(subscribeCustomer, readDocs, () => EMPTY_ALL);
  return (phone && all[phone]) || EMPTY_DOCS;
}
