import { rules } from "@/content/rules";
import { countText } from "../shared";
import type { RefundWindow } from "../cancellation";

// Arabic cancellation and refund windows: the same shape and the same windows as
// ../cancellation.ts. The cells are written to read both in the refund table and after
// "عند الإلغاء" in the legal sentences.

export type { RefundWindow };

export const refundWindows: RefundWindow[] = [
  { id: "standard", label: "السيارات الفاخرة والخارقة", full: "قبل البدء بـ72 ساعة أو أكثر", half: "قبل البدء بـ24 إلى 72 ساعة", none: "قبل البدء بأقل من 24 ساعة، أو عدم الحضور", fullHours: 72 },
  { id: "hypercar", label: "سيارات الهايبركار", full: "قبل البدء بـ7 أيام أو أكثر", half: "قبل البدء بـ72 ساعة إلى 7 أيام", none: "قبل البدء بأقل من 72 ساعة، أو عدم الحضور", fullHours: 168 },
  { id: "chauffeur", label: "السائق الخاص", full: "قبل البدء بـ24 ساعة أو أكثر", half: "قبل البدء بـ6 إلى 24 ساعة", none: "قبل البدء بأقل من 6 ساعات، أو عدم الحضور", fullHours: 24 },
];

export const advanceRule = `لتأكيد الحجز، قد نطلب دفعة مقدمة تصل إلى ${rules.advanceMaxPct}% من إجمالي قيمة الإيجار (بما لا يقل عن قيمة إيجار يوم واحد، أو الحد الأدنى البالغ ${countText(rules.chauffeur.minHours, "hour", "ar")} لحجوزات السائق الخاص).`;
