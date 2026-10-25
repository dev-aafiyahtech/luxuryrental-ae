import { formatDay, nowInDubai } from "@/lib/dates";

// Display helpers for the account area (no React).

/** "840 KB", "2.4 MB"; Arabic "840 كيلوبايت", "2.4 ميغابايت" (CLDR unit names, Western digits). */
export function formatBytes(bytes: number, locale?: string): string {
  const mb = bytes / (1024 * 1024);
  const [value, unit] = bytes < 1024 ? [bytes, "byte"] : bytes < 1024 * 1024 ? [Math.max(1, Math.round(bytes / 1024)), "kilobyte"] : [mb < 10 ? Math.round(mb * 10) / 10 : Math.round(mb), "megabyte"];
  if (locale === "ar") {
    try {
      return new Intl.NumberFormat("ar-u-nu-latn", { style: "unit", unit: unit as string, unitDisplay: "long", maximumFractionDigits: 1 }).format(value as number);
    } catch {
      /* fall through to the English short form */
    }
  }
  if (unit === "byte") return `${bytes} B`;
  if (unit === "kilobyte") return `${value} KB`;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** "Fri 24 Oct, 14:05" (Arabic "الجمعة 24 أكتوبر، 14:05") in Dubai time for an ISO timestamp. */
export function stamp(iso: string, locale?: string): string {
  const n = nowInDubai(new Date(iso));
  return `${formatDay(n.date, locale)}${locale === "ar" ? "، " : ", "}${n.time}`;
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
