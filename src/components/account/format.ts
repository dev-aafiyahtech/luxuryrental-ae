import { formatDay, nowInDubai } from "@/lib/dates";

// Display helpers for the account area (no React).

/** "840 KB", "2.4 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** "Fri 24 Oct, 14:05" in Dubai time for an ISO timestamp. */
export function stamp(iso: string): string {
  const n = nowInDubai(new Date(iso));
  return `${formatDay(n.date)}, ${n.time}`;
}

export const firstName = (name?: string) => name?.trim().split(/\s+/)[0] ?? "";

// Browsers on some desktops report HEIC/HEIF photos with an empty type: infer it from the extension.
const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  heif: "image/heif",
  webp: "image/webp",
  pdf: "application/pdf",
};

/** Name, type and size of a chosen file (the only details the demo keeps). */
export function fileInfo(file: File): { name: string; type: string; size: number } {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return { name: file.name, type: file.type || EXT_TYPES[ext] || "", size: file.size };
}

/** Image types most browsers can preview from an object URL. */
export const canPreview = (type: string) => ["image/jpeg", "image/png", "image/webp"].includes(type);
