import { cars, getCar } from "@/content/cars";
import { rules, seasons } from "@/content/rules";
import { getZone, zones } from "@/content/zones";
import { site } from "@/content/site";
import { localizeZones, seasonName } from "@/content/localize";
import type { Car, Season } from "@/content/types";
import { formatDayLong } from "@/lib/dates";
import { formatAED, formatNumber as n, formatPerDay } from "@/lib/format";
import * as en from "../pricing";
import {
  DEFAULT_MONTH_KM, countText, dayMonth as sharedDayMonth, festiveMinDays, flagshipCars, listJoin, monthKmFor, monthStamp, peakWeekendMinDays,
  seasonLabel, seasonPct, seasonTable, tierName,
} from "../shared";

// Arabic data and copy for /pricing: the same exports and shapes as ../pricing.ts, every figure
// read from cars.ts, rules.ts and zones.ts. Latin model names inside Arabic sentences are
// wrapped in Unicode isolates (LRI … PDI) so lists of them keep their order right to left.

export type { FeeRow } from "../pricing";
export { pricingCars, nextSeasonChange, validOffers } from "../pricing";
export { seasons };

const A = "ar";
const ltr = (text: string) => `⁦${text}⁩`;
const aed = (amount: number) => formatAED(amount, A);
const days = (count: number, nominative = false) => countText(count, "day", A, nominative);
const minutes = (count: number) => countText(count, "minute", A);
const and = (items: string[]) => listJoin(items, "and", A);

/** "1 نوفمبر" (day and month, no year). */
export const dayMonth: typeof en.dayMonth = (iso, locale = A) => sharedDayMonth(iso, locale);

export const pricingMeta: typeof en.pricingMeta = {
  title: (stamp: string) => `أسعار تأجير السيارات الفاخرة في دبي (تحديث ${stamp})`,
  description: `الأسعار اليومية والأسبوعية والشهرية لجميع سياراتنا الـ${cars.length}، مع مبلغ التأمين والكيلومترات ورسوم سالك والوقود والتوصيل في جدول واحد. الأسعار بالدرهم الإماراتي وتشمل ضريبة القيمة المضافة.`,
};

/** Seasons table rows, the season name in Arabic. */
export const seasonRows: typeof en.seasonRows = () => {
  const flagship = and(flagshipCars().map((c) => ltr(c.model.replace(/ Series II.*$/, ""))));
  return seasonTable(A).map(({ season, ranges }) => {
    const pct = seasonPct(season);
    const rate =
      season.id === "standard" ? "جدول الأسعار العادية" :
      season.id === "peak" ? `جدول أسعار موسم الذروة، أعلى من العادي بنحو ${pct}%` :
      `${pct < 0 ? "أقل" : "أعلى"} من السعر العادي بنسبة ${Math.abs(pct)}%`;
    const notes: string[] = [];
    if (season.id === "summer" || season.id === "standard") notes.push(`سعر أيام الأسبوع: خصم ${rules.weekdayDiscountPct}% عندما يكون الاستلام والإرجاع كلاهما من الاثنين إلى الخميس.`);
    if (season.id === "peak") notes.push(`حد أدنى للإيجار مدته ${days(peakWeekendMinDays(), true)} لسياراتنا الرائدة (${flagship}) عند الاستلام من الجمعة إلى الأحد.`);
    if (season.id === "super-peak") notes.push(`حد أدنى للإيجار مدته ${days(festiveMinDays(), true)} لجميع السيارات. وتُضاف نسبة ${rules.chauffeur.superPeakSurchargePct}% إلى حجوزات السائق الخاص.`);
    const localized: Season = { ...season, name: seasonName(season, A) };
    return { season: localized, ranges, rate, notes };
  });
};

/** "من يوم واحد إلى يومين", "من 3 إلى 6 أيام", "من 7 إلى 29 يوماً". */
const dayRange = (a: number, b: number) => (a >= 3 ? `من ${a} إلى ${days(b)}` : `من ${days(a)} إلى ${days(b)}`);

/** Rental-length ladder rows, with a worked example on one reference car at the standard rate. */
export const ladderRows: typeof en.ladderRows = (exampleSlug = "ferrari-296-gts") => {
  const car = getCar(exampleSlug) ?? cars[0];
  const daily = car.rates.daily;
  const steps = rules.ladder;
  const rows = steps.map((step, i) => {
    const next = steps[i + 1];
    const toDays = next ? next.fromDays - 1 : 29;
    const pct = step.pct;
    const exampleDays = step.fromDays === 1 ? 1 : step.fromDays;
    const total = Math.round(daily * (pct / 100) * exampleDays);
    const how =
      pct === 100 ? "السعر اليومي للموسم" :
      Math.abs(pct * 7 - 600) < 0.01 ? "7 أيام بسعر 6" :
      `خصم ${Math.round(100 - pct)}% على السعر اليومي`;
    return {
      key: `from-${step.fromDays}`,
      length: dayRange(step.fromDays, toDays),
      how,
      example: `${days(exampleDays, true)}: ${aed(total)}`,
      perDay: aed(Math.round(total / exampleDays)),
    };
  });
  if (car.rates.monthly) {
    rows.push({
      key: "monthly",
      length: days(30, true),
      how: "سعر ثابت لمدة 30 يوماً، هو نفسه طوال العام",
      example: `${days(30, true)}: ${aed(car.rates.monthly)}`,
      perDay: aed(Math.round(car.rates.monthly / 30)),
    });
  }
  return { car, rows };
};

export const feeGroups: typeof en.feeGroups = () => {
  const dubai = getZone("dubai")!;
  const t = rules.tolls;
  const [freeFrom, freeTo] = t.salikFreeHours.split("–");
  const handover: en.FeeRow[] = localizeZones(zones, A).map((z) => ({
    key: z.slug,
    fee: z.name,
    amount: z.fee === null ? "عند الطلب" : z.fee === 0 ? "مجاناً" : aed(z.fee),
    detail: z.slug === "dubai" ? `لكل اتجاه. مجاناً للإيجارات التي تبلغ مدتها ${days(dubai.freeFromDays ?? 0)} أو أكثر.` : z.kind === "airport" ? "لكل عملية تسليم، وتشمل رسوم المواقف وخدمة الاستقبال." : z.fee === null ? (z.note ?? "") : z.fee === 0 ? "استلام السيارة وإرجاعها في مكتبنا." : "لكل اتجاه.",
  }));
  handover.push(
    { key: "airport-wait", fee: "الانتظار في المطار", amount: `${aed(rules.airportWaitPerHour)} / ساعة`, detail: `بعد أول ${minutes(rules.airportWaitFreeMinutes)}، وهي مجانية. لكل ساعة أو جزء منها.` },
    { key: "ooh", fee: "التسليم خارج ساعات العمل", amount: aed(rules.outOfHoursFee), detail: `لكل عملية تسليم خارج الفترة من ${rules.handoverHours.from} إلى ${rules.handoverHours.to}، بحسب التوفر.` },
  );
  const cover: en.FeeRow[] = (["L", "S", "H"] as const).map((tier) => {
    const r = rules.tiers[tier];
    return { key: `fc-${tier}`, fee: `التغطية الشاملة، ${tierName(tier, A)}`, amount: formatPerDay(r.fullCoverPerDay, A), detail: `ينخفض مبلغ التحمّل من ${aed(r.excess)} إلى ${aed(r.fullCoverExcess)}. وتشمل الإطارات والجنوط والزجاج.` };
  });
  cover.push(
    { key: "driver", fee: "سائق إضافي", amount: formatPerDay(rules.additionalDriverPerDay, A), detail: "لكل سائق. تسري عليه قواعد العمر والرخصة نفسها المطبقة على السائق الرئيسي." },
    { key: "child-seat", fee: "مقعد أطفال", amount: rules.childSeatPerDay ? formatPerDay(rules.childSeatPerDay, A) : "مجاناً", detail: "عند الطلب." },
  );
  const during: en.FeeRow[] = [
    { key: "salik", fee: "رسوم سالك ودرب", amount: `${n(t.salikOffPeak)}–${aed(t.salikPeak)} + ${aed(rules.tollAdminFee)}`, detail: `لكل عبور، تُحتسب بالتكلفة الفعلية. سالك: ${aed(t.salikPeak)} من الاثنين إلى السبت من 06:00 إلى 10:00 ومن 16:00 إلى 20:00، و${aed(t.salikOffPeak)} في الأوقات الأخرى وأيام الأحد، ومجاناً من ${freeFrom} إلى ${freeTo}. درب في أبوظبي: ${aed(t.darbPeak)} في أوقات الذروة. يُضاف إليها رسمنا الإداري البالغ ${aed(rules.tollAdminFee)} عن كل عبور.` },
    { key: "fuel", fee: "إعادة التزويد بالوقود", amount: `الوقود + ${aed(rules.refuelFee)}`, detail: "إذا أُعيدت السيارة بوقود أقل مما كان عند التسليم. يُحتسب الوقود بسعر المحطة." },
    { key: "fines", fee: "مخالفات السير والمواقف", amount: `المخالفة + ${aed(rules.fineAdminFee)}`, detail: "رسم إداري عن كل مخالفة. وتُحوَّل النقاط السوداء حيثما تسمح الجهة المختصة بذلك." },
    { key: "extra-km", fee: "الكيلومترات الإضافية", amount: `${n(Math.min(...cars.map((c) => c.rates.extraKm)))}–${aed(Math.max(...cars.map((c) => c.rates.extraKm)))} / كم`, detail: "يعتمد على السيارة؛ انظر الجدول أعلاه." },
    { key: "late", fee: "التأخر في الإرجاع", amount: `${rules.lateReturnHourPct}% من السعر اليومي / ساعة`, detail: `مجاناً لأول ${minutes(rules.graceMinutes)}، ثم لكل ساعة أو جزء منها، بحد أقصى يوم إضافي واحد.` },
    { key: "cleaning", fee: "التدخين أو التنظيف الخاص", amount: aed(rules.cleaningFee), detail: "يُمنع التدخين والتدخين الإلكتروني والحيوانات الأليفة. ونرحب بحيوانات المساعدة المرافقة لأصحاب الهمم." },
  ];
  return [
    { id: "fees-handover", title: "التوصيل والاستلام والتسليم", rows: handover },
    { id: "fees-cover", title: "التغطية والسائقون والإضافات", rows: cover },
    { id: "fees-during", title: "خلال فترة الإيجار", rows: during },
  ];
};

/** Headings, labels and notes for the /pricing page, the same shape as the English `pricingPage`. */
export const pricingPage: typeof en.pricingPage = {
  crumbs: { home: "الرئيسية", page: "الأسعار" },
  jumpLabel: "في هذه الصفحة",
  jump: [
    { id: "rates", label: "أسعار السيارات" },
    { id: "seasons", label: "المواسم" },
    { id: "longer", label: "الإيجارات الأطول" },
    { id: "fees", label: "الرسوم" },
    { id: "offers", label: "العروض" },
  ],
  hero: {
    eyebrow: (iso: string) => `الأسعار · تحديث ${monthStamp(iso, A)}`,
    title: "أسعار تأجير السيارات الفاخرة",
    lede: [
      `جميع الأسعار ومبالغ التأمين والرسوم لسياراتنا الـ${cars.length} في صفحة واحدة.`,
      `الأسعار بالدرهم الإماراتي وتشمل ضريبة القيمة المضافة بنسبة ${site.vatRate}%. أما مبلغ التأمين فحجز مسترد على بطاقتك، ويظهر بشكل منفصل.`,
    ],
  },
  facts: (f: { dailyFrom: number; season: Season; depositFrom: number; km: number }) => ({
    label: "الأسعار في لمحة",
    items: [
      { label: "الأسعار اليومية ابتداءً من", value: aed(f.dailyFrom), note: seasonLabel(f.season, A) },
      { label: "مبلغ التأمين ابتداءً من", value: aed(f.depositFrom), note: "حجز مسترد على بطاقتك" },
      { label: "المشمول", value: `${f.km} كم / يوم`, note: "لمعظم السيارات" },
      { label: "ضريبة القيمة المضافة", value: `${site.vatRate}% مشمولة`, note: "في جميع الأسعار المعروضة" },
    ],
  }),
  rates: {
    eyebrow: "أسعار السيارات",
    title: "أسعار كل سيارة",
    intro: (today: string, season: Season, change?: { date: string; season: Season }) =>
      `اليوم، ${formatDayLong(today, A)}، يقع ضمن **${seasonLabel(season, A)}**${change ? `، ويبدأ ${seasonLabel(change.season, A)} في ${dayMonth(change.date)}` : ""}. ويعرض عمود «اليوم» السعر اليومي للاستلام اليوم.`,
    caption: `الأسعار اليومية وأسعار 7 أيام و30 يوماً ومبلغ التأمين والكيلومترات لجميع سياراتنا الـ${cars.length}`,
    columns: [
      ["السيارة"], ["اليوم", "لليوم"], ["العادي", "لليوم"], ["الذروة", "لليوم"], [days(7, true), "الإجمالي"], [days(30, true), "الإجمالي"],
      ["مبلغ التأمين", "حجز على البطاقة"], ["المشمول", "يومياً"], ["الكيلومتر الإضافي", "لكل كم"], ["السائق الخاص", "ابتداءً من / ساعة"],
    ],
    carNote: (car: Car) => `${tierName(car.tier, A)}${car.chauffeurFirst ? " · مع سائق خاص أولاً" : ""}${car.rates.onRequest ? " · السعر عند الطلب" : ""}`,
    from: "ابتداءً من",
    weeklyOnRequest: "عند الطلب",
    monthlyNotOffered: "غير متاح",
    selfDriveOnly: "قيادة ذاتية فقط",
    km: (km: number) => `${n(km)} كم`,
    footnote: `جميع الأسعار بالدرهم الإماراتي وتشمل ضريبة القيمة المضافة بنسبة ${site.vatRate}%. تسري الأسعار العادية في الربيع والخريف، وأسعار الذروة من نوفمبر إلى مارس؛ أما أسعار الصيف وذروة الأعياد فتُحتسب انطلاقاً من السعر العادي (انظر المواسم أدناه). أسعار Bugatti هي الحد الذي تبدأ منه عروض الأسعار، ونؤكد السعر النهائي عبر واتساب. يشمل سعر الـ30 يوماً ${n(DEFAULT_MONTH_KM)} كم${cars.filter((c) => monthKmFor(c) !== DEFAULT_MONTH_KM).map((c) => ` (${n(monthKmFor(c))} كم لسيارة ${ltr(c.model)})`).join("")}. وأسعار السائق الخاص متاحة في [صفحة السائق الخاص](/chauffeur).`,
    scrollHint: "مرّر الجدول أفقياً لرؤية جميع الأعمدة، ويبقى اسم السيارة ظاهراً.",
  },
  seasons: {
    eyebrow: "المواسم",
    title: "المواسم والحد الأدنى للإيجار",
    intro: "يُحدَّد الموسم بتاريخ الاستلام، بتوقيت دبي.",
    caption: "المواسم وتواريخها وأثرها على السعر اليومي",
    columns: ["الموسم", "التواريخ", "السعر اليومي", "يسري أيضاً"],
    now: "الآن",
    nothingExtra: "لا شيء إضافي.",
    joinRanges: (ranges: string[]) => and(ranges),
  },
  longer: {
    eyebrow: "الإيجارات الأطول",
    title: "كلما طالت مدة الإيجار، قلّ ما تدفعه في اليوم",
    intro: (car: Car) => `يوم الإيجار 24 ساعة من وقت التسليم، مع مهلة سماح مدتها ${minutes(rules.graceMinutes)} في نهايته. ويستخدم المثال سيارة ${ltr(car.name)} بسعرها العادي البالغ ${aed(car.rates.daily)} في اليوم.`,
    caption: "التسعير حسب مدة الإيجار",
    columns: ["مدة الإيجار", "طريقة التسعير", "مثال", "لليوم"],
    footnote: `لا تتجاوز تكلفة الإيجار الطويل أبداً سعر الـ30 يوماً. ويمكنك طلب إيجار لمدة تصل إلى ${days(rules.maxOnlineDays)} عبر الإنترنت؛ أما الإيجارات الأطول فراسلنا بشأنها عبر واتساب. وتُسعَّر سيارات Bugatti عند الطلب.`,
  },
  fees: {
    eyebrow: "الرسوم",
    title: "جميع الرسوم في مكان واحد",
    intro: "تُضاف رسوم التوصيل والإضافات إلى عرض السعر قبل أن ترسل طلبك. أما الرسوم التي تنشأ خلال الإيجار فتُخصم من مبلغ التأمين أو تُحصَّل من البطاقة المسجلة لدينا، مع الإيصال.",
    columns: ["الرسم", "المبلغ", "التفاصيل"],
    note: "يُشرح مبلغ التحمّل ومبلغ التأمين وموعد الإفراج عنه في [متطلبات الإيجار](/requirements#insurance)، ومناطق التوصيل في [صفحة التوصيل](/delivery).",
  },
  offers: {
    eyebrow: "عروض الإطلاق",
    title: "العروض",
    intro: "يطبّق عرض السعر عرضاً واحداً على كل حجز، وهو العرض الذي يوفّر لك أكثر. وتنتهي العروض في التاريخ المذكور.",
    none: "لا توجد عروض سارية حالياً.",
    vat: `الأسعار بالدرهم الإماراتي وتشمل ضريبة القيمة المضافة بنسبة ${site.vatRate}%.`,
  },
  cta: {
    title: "اطّلع على سعرك الدقيق",
    text: "اختر سيارة ومواعيدك. ويعرض عرض السعر قيمة الإيجار والتوصيل والإضافات قبل أن ترسل الطلب، ولا يُخصم أي مبلغ على هذا الموقع.",
    whatsappText: `مرحباً ${site.businessName}، لدي سؤال عن الأسعار.`,
    whatsapp: "اسأل عبر واتساب",
    fleet: "تصفّح الأسطول",
  },
  inLanguage: "ar",
};
