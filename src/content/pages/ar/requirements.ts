import { cars, getCar } from "@/content/cars";
import { rules } from "@/content/rules";
import { site } from "@/content/site";
import type { Tier } from "@/content/types";
import { formatAED, formatPerDay } from "@/lib/format";
import type { FaqEntry } from "../faq";
import type { requirementsPage as RequirementsPageEn } from "../requirements";
import {
  carsInTier, commonKmPerDay, countText, depositRange, festiveDates, festiveMinDays, flagshipCars, hypercars,
  kmExceptions, listJoin, monthStamp, noticeText, peakWeekendMinDays, tierName, tierOrder, salikTariff,
} from "../shared";

// Arabic copy for /requirements: the same shape as ../requirements.ts, every rule read from
// rules.ts and cars.ts. Latin car names inside Arabic text are wrapped in Unicode isolates
// (LRI … PDI) so lists of them keep their order right to left.

const A = "ar";
const ltr = (text: string) => `⁦${text}⁩`;
const aed = (amount: number) => formatAED(amount, A);
const days = (n: number, nominative = false) => countText(n, "day", A, nominative);
const hours = (n: number, nominative = false) => countText(n, "hour", A, nominative);
const minutes = (n: number) => countText(n, "minute", A);
const and = (items: string[]) => listJoin(items, "and", A);
const arPlural = new Intl.PluralRules("ar");

/** Working days, from a number (7) or a range in rules ("5 to 14"): "7 أيام عمل", "من 5 إلى 14 يوم عمل". */
function workingDays(spec: number | string): string {
  const [a, b] = String(spec).split(/\s*to\s*/).map(Number);
  const noun = (n: number) => (arPlural.select(n) === "few" ? "أيام عمل" : "يوم عمل");
  if (b !== undefined && !Number.isNaN(b)) return `من ${a} إلى ${b} ${noun(b)}`;
  return `${a} ${noun(a)}`;
}

const c = rules.chauffeur;
const phantom = getCar("rolls-royce-phantom")!;
const { L: tierL, S: tierS, H: tierH } = rules.tiers;
const sameRelease = tierL.releaseDays === tierS.releaseDays;
const releaseText = sameRelease ? days(tierL.releaseDays) : `${days(tierL.releaseDays)} أو ${days(tierS.releaseDays)}`;

export const requirementsPage: typeof RequirementsPageEn = {
  meta: {
    title: "ما تحتاجه لاستئجار سيارة خارقة في دبي: العمر والرخصة والرخصة الدولية",
    description: `الحد الأدنى للعمر، ومدة حمل الرخصة، وقواعد رخصة القيادة الدولية حسب البلد، ومبلغ التأمين والمستندات، للمقيمين والزوار. السائقون بعمر ${tierL.minAge} عاماً فأكثر، أو ${tierH.minAge} عاماً فأكثر لسيارات Bugatti.`,
  },
  hero: {
    eyebrow: "متطلبات الإيجار",
    title: "ما تحتاجه لاستئجار سيارة فاخرة في دبي",
    lede: [
      "رخصة قيادة كاملة، وجواز سفرك أو بطاقة الهوية الإماراتية، وبطاقة ائتمانية باسم السائق الرئيسي.",
      "تعتمد قواعد العمر والرخصة على السيارة. ونتحقق من كل شيء عند التسليم، كما نتحقق من بلد إصدار رخصتك عبر واتساب قبل أن نؤكد الحجز.",
    ],
  },
  facts: () => {
    const minYears = Math.min(...tierOrder.map((t) => rules.tiers[t].licenceYears));
    const maxYears = Math.max(...tierOrder.map((t) => rules.tiers[t].licenceYears));
    return [
      { label: "الحد الأدنى للعمر", value: `${tierL.minAge}`, note: `${tierH.minAge} عاماً لسيارات Bugatti` },
      { label: "مدة حمل الرخصة", value: `${minYears}–${countText(maxYears, "year", A, true)}`, note: "حسب السيارة" },
      { label: "مبلغ التأمين ابتداءً من", value: aed(Math.min(...cars.map((car) => car.rates.deposit))), note: "بطاقة ائتمانية فقط" },
      { label: "مهلة الحجز", value: noticeText(tierL.leadHours, A), note: `${noticeText(tierH.leadHours, A)} لسيارات Bugatti` },
    ];
  },
  tierRows: () => tierOrder.map((t: Tier) => {
    const tier = rules.tiers[t];
    const list = carsInTier(t);
    return {
      tier: t,
      name: tierName(t, A),
      cars: list.map((car) => car.name),
      minAge: tier.minAge,
      licenceYears: tier.licenceYears,
      notice: noticeText(tier.leadHours, A),
      deposit: depositRange(list, A),
      excess: aed(tier.excess),
    };
  }),
  tierNotes: () => [
    "تحتاج سيارات Bugatti أيضاً إلى موافقة فريقنا وشركة التأمين لدينا قبل أن نؤكد الحجز.",
    `تُقدَّم سيارة ${ltr(phantom.name.replace(/ Series II.*$/, ""))} مع سائق خاص أولاً. وتتطلب القيادة الذاتية موافقتنا وأن يكون السائق بعمر ${phantom.minAge} عاماً أو أكثر.`,
    `عمرك أقل من ${tierL.minAge} عاماً؟ لا يمكنك أن تكون السائق الرئيسي أو سائقاً إضافياً، لكن يمكنك حجز خدمة السائق الخاص لدينا.`,
  ],
  licences: [
    { title: "المقيمون في الإمارات", text: "يجب على المقيمين في دولة الإمارات القيادة برخصة قيادة إماراتية سارية." },
    { title: "رخص دول مجلس التعاون", text: "يمكن للزوار القيادة برخصة صادرة في السعودية أو الكويت أو قطر أو البحرين أو عُمان." },
    { title: "دول تعتمدها هيئة الطرق والمواصلات", text: "يمكن للزوار القيادة برخصة بلدهم إذا كانت صادرة من دولة مدرجة في قائمة الدول المعتمدة لدى هيئة الطرق والمواصلات، مثل المملكة المتحدة ودول الاتحاد الأوروبي والولايات المتحدة وكندا وأستراليا واليابان وكوريا الجنوبية وسنغافورة." },
    { title: "جميع الدول الأخرى", text: "يحتاج الزوار الذين يحملون رخصة من أي دولة أخرى إلى رخصة قيادة دولية إلى جانب رخصة بلدهم." },
  ],
  licenceNote: "يجب أن تكون الرخص كاملة (وليست رخص تعلّم أو رخصاً مؤقتة) وسارية طوال مدة الإيجار. وتتغير قائمة هيئة الطرق والمواصلات من وقت لآخر، لذا نتحقق من بلد إصدار رخصتك عبر واتساب قبل أن نؤكد الحجز.",
  documents: {
    visitors: ["جواز السفر", "ختم الدخول إلى الإمارات أو صفحة التأشيرة", "رخصة القيادة", "رخصة القيادة الدولية، عند الحاجة"],
    residents: ["بطاقة الهوية الإماراتية", "رخصة القيادة الإماراتية"],
    note: "يمكنك تحميل صور لها مسبقاً من صفحة حالة طلبك أو من حسابك، لنتحقق منها قبل الموعد فلا يستغرق التسليم سوى دقائق. وأحضر المستندات الأصلية إلى التسليم أيضاً: نتحقق منها ونعيدها إليك فوراً، ولا نحتفظ أبداً بجواز سفرك أو بطاقة هويتك الإماراتية.",
  },
  deposit: () => [
    { label: "البطاقة", value: "بطاقة ائتمانية باسم السائق الرئيسي. ولا نقبل بطاقات الخصم المباشر أو النقد لمبلغ التأمين." },
    { label: "المبلغ", value: `${depositRange(carsInTier("L"), A)} (${tierName("L", A)})، و${depositRange(carsInTier("S"), A)} (${tierName("S", A)})، و${depositRange(carsInTier("H"), A)} (${tierName("H", A)}). ومبلغ التأمين لكل سيارة مذكور في صفحة الأسعار.` },
    { label: "موعد الحجز على البطاقة", value: "يُحجز على بطاقتك عند التسليم. وبما أنه حجز، لا يُقتطع أي مبلغ من حسابك ما لم نخصم رسوماً مستحقة." },
    { label: "الإفراج عنه", value: `بعد ${releaseText} من إرجاع السيارة (${days(tierH.releaseDays)} لسيارات Bugatti)، بعد خصم أي مخالفات أو رسوم طرق أو رسوم أخرى. وقد يحتاج مصرفك إلى مدة إضافية تتراوح ${workingDays(rules.bankReleaseWorkingDays)}.` },
    { label: "المخالفات اللاحقة", value: "إذا وصلت مخالفة بعد الإفراج عن المبلغ، نحصّلها من البطاقة المسجلة لدينا ونرسل إليك إشعار المخالفة." },
  ],
  drivers: `يجب أن يستوفي السائقون الإضافيون قواعد العمر والرخصة نفسها وأن تُذكر أسماؤهم في عقد الإيجار. وتبلغ تكلفة كل منهم ${aed(rules.additionalDriverPerDay)} في اليوم. وإذا قاد السيارة شخص غير مذكور في العقد، فلا يغطيه التأمين.`,
  noticeRows: () => {
    const baseMin = Math.min(...cars.filter((car) => car.tier !== "H").map((car) => car.minDays));
    const hyperMin = Math.min(...hypercars().map((car) => car.minDays));
    return [
      { key: "ls", what: `القيادة الذاتية: ${and([tierName("L", A), tierName("S", A)])}`, notice: tierL.leadHours === tierS.leadHours ? noticeText(tierL.leadHours, A) : `${noticeText(tierL.leadHours, A)} / ${noticeText(tierS.leadHours, A)}`, min: `${days(baseMin, true)} (24 ساعة)` },
      { key: "h", what: `${tierName("H", A)} (Bugatti)`, notice: noticeText(tierH.leadHours, A), min: days(hyperMin, true) },
      { key: "ch", what: "السائق الخاص", notice: noticeText(c.leadHours, A), min: hours(c.minHours, true) },
      { key: "festive", what: `أي سيارة، ذروة الأعياد (${festiveDates(A)})`, notice: "كما هو أعلاه", min: days(festiveMinDays(), true) },
      { key: "peak", what: "السيارات الرائدة، الاستلام من الجمعة إلى الأحد في موسم الذروة", notice: "كما هو أعلاه", min: days(peakWeekendMinDays(), true) },
    ];
  },
  noticeNote: () => `تتم عمليات تسليم سيارات القيادة الذاتية من الساعة ${rules.handoverHours.from} إلى الساعة ${rules.handoverHours.to}. ويمكنك الحجز قبل موعد الإيجار بمدة تصل إلى ${countText(Math.round(rules.maxAdvanceDays / 30.4), "month", A)}، وطلب إيجار لمدة تصل إلى ${days(rules.maxOnlineDays)} عبر الإنترنت. السيارات الرائدة: ${and(flagshipCars().map((car) => ltr(car.name)))}.`,
  insuranceRows: () => tierOrder.map((t) => {
    const tier = rules.tiers[t];
    return { key: t, tier: tierName(t, A), excess: aed(tier.excess), fullCover: formatPerDay(tier.fullCoverPerDay, A), withCover: aed(tier.fullCoverExcess) };
  }),
  exclusions: ["القيادة تحت تأثير الكحول أو المخدرات", "سائق غير مذكور في العقد", "السباقات أو الاستخدام على الحلبات", "القيادة على الطرق الوعرة أو الرمال", "مغادرة دولة الإمارات", "الأضرار التي لا يوجد بشأنها تقرير من الشرطة"],
  accident: `أبلغ الشرطة (عبر تطبيق شرطة دبي أو على الرقم 999) وأبلغنا فوراً بأي حادث أو ضرر. ومن دون تقرير من الشرطة تتحمل تكلفة الإصلاح كاملة. وتُحتسب الأضرار وفق تقدير من ورشة الوكيل، بحد أقصى يساوي مبلغ التحمّل عندما يسري التأمين. ويبلغ بدل فوات المنفعة خلال فترة الإصلاح ${rules.lossOfUsePct}% من السعر اليومي، لمدة أقصاها ${days(rules.lossOfUseMaxDays)}.`,
  onTheRoad: () => {
    const common = commonKmPerDay();
    const byKm = new Map<number, string[]>();
    for (const car of kmExceptions()) byKm.set(car.rates.kmPerDay, [...(byKm.get(car.rates.kmPerDay) ?? []), car.model]);
    const kmText = [...byKm.entries()].map(([km, models]) => `${km} كم ${models.length === 1 ? `لسيارة ${ltr(models[0])}` : `لكل من ${and(models.map(ltr))}`}`).join("، و");
    return [
      { label: "الوقود", value: `أعد السيارة بمستوى الوقود نفسه. وإذا كان أقل، نحتسب الوقود بسعر المحطة مضافاً إليه ${aed(rules.refuelFee)}. وتعمل السيارات الخارقة وسيارات الهايبركار ببنزين سوبر 98 فقط.` },
      { label: "الكيلومترات", value: `${common} كم يومياً لمعظم السيارات${kmText ? ` (${kmText})` : ""}. وتُحتسب الكيلومترات الإضافية لكل كيلومتر بالسعر المذكور في صفحة الأسعار.` },
      { label: "سالك ودرب", value: `يُحتسب كل عبور من بوابات رسوم الطرق وفق التعرفة، ${salikTariff(A)}، مضافاً إليه ${aed(rules.tollAdminFee)}. وتبلغ رسوم درب في أبوظبي ${aed(rules.tolls.darbPeak)} في أوقات الذروة.` },
      { label: "المخالفات", value: `تتحمل المخالفات المسجلة خلال فترة الإيجار، مضافاً إليها رسم إداري قدره ${aed(rules.fineAdminFee)} عن كل مخالفة. وحيثما تسمح الجهة المختصة، نحوّل المخالفة والنقاط السوداء إلى رخصة السائق. وإذا حُجزت السيارة بسبب طريقة قيادتها، تتحمل تكاليف الحجز والإفراج عنها وبدل فوات المنفعة.` },
      { label: "أين يمكنك القيادة", value: "داخل دولة الإمارات فقط. ويتطلب العبور إلى سلطنة عُمان، والقيادة على الطرق الوعرة أو الحلبات، والسباقات، وخدمات نقل الركاب عبر التطبيقات، والتصوير التجاري موافقتنا الكتابية." },
      { label: "داخل السيارة", value: `يُمنع التدخين والتدخين الإلكتروني والحيوانات الأليفة (ونرحب بحيوانات المساعدة المرافقة لأصحاب الهمم). وتبلغ تكلفة التنظيف أو إزالة الروائح ${aed(rules.cleaningFee)}.` },
      { label: "التتبع", value: "سياراتنا مزودة بأجهزة تتبع GPS لأغراض الأمان والاسترداد. ولا نطّلع على موقع السيارة إلا في حالات السرقة أو الطوارئ أو الحوادث أو الاشتباه في مخالفة هذه القواعد." },
      { label: "التأخر في الإرجاع", value: `التأخير حتى ${minutes(rules.graceMinutes)} مجاني. وبعد ذلك تُحتسب كل ساعة أو جزء منها بنسبة ${rules.lateReturnHourPct}% من السعر اليومي، بحد أقصى يوم إضافي واحد.` },
    ];
  },
  chauffeurRules: () => [
    `احجز قبل الموعد بـ${hours(c.leadHours)} على الأقل. والحد الأدنى للحجز ${hours(c.minHours, true)}، ويعمل السائق الواحد حتى ${hours(c.maxHours)} في اليوم.`,
    `حتى ${countText(rules.chauffeur.maxPassengers, "passenger", A)}، أو أقل إذا كان عدد مقاعد السيارة أقل. ومقاعد الأطفال مجانية عند الطلب.`,
    "يُحتسب وقت الانتظار ضمن مدة الحجز. وتُحتسب رسوم المواقف بتكلفتها الفعلية.",
    "يلتزم سائقك الخاص بقوانين السير في دولة الإمارات، ويحق له رفض أي طلب غير آمن أو مخالف للقانون.",
  ],
  // The last four entries mirror faq.ts by id ("idp", "documents", "deposit-release",
  // "insurance"). Switch to faqsById from ./faq once the Arabic FAQ module ships.
  faqs: (): FaqEntry[] => [
    {
      id: "under-25",
      q: `هل يمكنني استئجار سيارة إذا كان عمري أقل من ${tierL.minAge} عاماً؟`,
      a: `ليس للقيادة بنفسك. يجب أن يكون السائق الرئيسي وأي سائقين إضافيين بعمر ${tierL.minAge} عاماً أو أكثر لجميع السيارات التي نؤجرها، و${tierH.minAge} عاماً أو أكثر لسيارات Bugatti. ولا توجد قاعدة عمرية للركاب في حجوزات السائق الخاص، لذا فإن [خدمة السائق الخاص](/chauffeur) لدينا هي طريقتك للتنقل في إحدى سياراتنا.`,
    },
    {
      id: "idp",
      q: "هل أحتاج إلى رخصة قيادة دولية؟",
      a: "يعتمد ذلك على مكان إصدار رخصتك. يجب على المقيمين في دولة الإمارات القيادة برخصة إماراتية. ويمكن للزوار القيادة برخصة من إحدى دول مجلس التعاون الخليجي، أو من دولة مدرجة في قائمة الدول المعتمدة لدى هيئة الطرق والمواصلات، مثل المملكة المتحدة ودول الاتحاد الأوروبي والولايات المتحدة وكندا وأستراليا واليابان وكوريا الجنوبية وسنغافورة. أما الزوار الذين يحملون رخصة من أي مكان آخر فيحتاجون إلى رخصة قيادة دولية إلى جانب رخصة بلدهم.\n\nأخبرنا ببلد إصدار رخصتك عند إرسال الطلب، وسنتحقق منها عبر واتساب قبل أن نؤكد الحجز.",
    },
    {
      id: "documents",
      q: "ما المستندات التي يجب أن أحضرها؟",
      a: "**الزوار:** جواز السفر، وختم الدخول إلى الإمارات أو صفحة التأشيرة، ورخصة القيادة، ورخصة القيادة الدولية إذا كنت تحتاج إليها. **المقيمون:** بطاقة الهوية الإماراتية ورخصة القيادة الإماراتية.\n\nأحضر المستندات الأصلية إلى التسليم. نتحقق منها ونعيدها إليك فوراً، ولا نحتفظ أبداً بجواز سفرك أو بطاقة هويتك الإماراتية.",
    },
    {
      id: "deposit-release",
      q: "متى أسترد مبلغ التأمين؟",
      a: `نُفرج عن المبلغ المحجوز بعد ${sameRelease ? days(tierL.releaseDays) : `${days(tierL.releaseDays)} (${tierName("L", A)}) أو ${days(tierS.releaseDays)} (${tierName("S", A)})`} من إرجاع السيارة، أو بعد ${days(tierH.releaseDays)} لسيارات Bugatti، بعد خصم أي مخالفات أو رسوم طرق أو رسوم أخرى. وقد يحتاج مصرفك إلى مدة إضافية تتراوح ${workingDays(rules.bankReleaseWorkingDays)} لإظهاره. وإذا وصلت مخالفة بعد الإفراج عن المبلغ، نحصّلها من البطاقة المسجلة لدينا ونرسل إليك إشعار المخالفة.`,
    },
    {
      id: "insurance",
      q: "هل التأمين مشمول؟",
      a: `نعم، يشمل كل إيجار تأميناً شاملاً. وعن كل مطالبة بأضرار تدفع ما لا يزيد على مبلغ التحمّل: ${aed(tierL.excess)} للسيارات الفاخرة، و${aed(tierS.excess)} للسيارات الخارقة، و${aed(tierH.excess)} لسيارات Bugatti.\n\nلا يسري التأمين على القيادة تحت تأثير الكحول أو المخدرات، أو القيادة من قِبل سائقين غير مذكورين في العقد، أو السباقات أو الاستخدام على الحلبات، أو القيادة على الطرق الوعرة أو الرمال، أو مغادرة دولة الإمارات، أو الأضرار التي لا يوجد بشأنها تقرير من الشرطة.`,
    },
  ],
  ui: {
    crumbs: { home: "الرئيسية", page: "متطلبات الإيجار" },
    jumpLabel: "في هذه الصفحة",
    jump: [
      { id: "age", label: "العمر والرخصة" },
      { id: "licences", label: "الرخص والرخصة الدولية" },
      { id: "documents", label: "المستندات" },
      { id: "deposit", label: "مبلغ التأمين" },
      { id: "notice", label: "مهلة الحجز" },
      { id: "insurance", label: "التأمين" },
      { id: "on-the-road", label: "الوقود ورسوم الطرق والمخالفات" },
      { id: "chauffeur", label: "السائق الخاص" },
    ],
    updated: (iso: string) => `تحديث ${monthStamp(iso, A)}`,
    factsLabel: "المتطلبات في لمحة",
    age: {
      eyebrow: "العمر والرخصة",
      title: "قواعد العمر والرخصة حسب السيارة",
      caption: "قواعد السائق حسب فئة السيارة",
      columns: ["الفئة", "الحد الأدنى للعمر", "مدة حمل الرخصة", "مهلة الحجز", "مبلغ التأمين", "مبلغ التحمّل"],
      minAge: (age: number) => `${age} عاماً فأكثر`,
      years: (years: number) => countText(years, "year", A, true),
      carList: (names: string[]) => names.map(ltr).join("، "),
    },
    licences: { eyebrow: "الرخص", title: "الرخص التي يمكنك القيادة بها" },
    documents: { eyebrow: "المستندات", title: "ما تحضره إلى التسليم", visitors: "الزوار", residents: "المقيمون في الإمارات" },
    deposit: { eyebrow: "البطاقة الائتمانية ومبلغ التأمين", title: "مبلغ التأمين", drivers: "السائقون الإضافيون" },
    notice: { eyebrow: "مهلة الحجز والحد الأدنى للإيجار", title: "متى تحجز مسبقاً", caption: "مهلة الحجز والحد الأدنى للإيجار", columns: ["الحجز", "المهلة", "الحد الأدنى"] },
    insurance: {
      eyebrow: "التأمين ومبلغ التحمّل",
      title: "التأمين ومبلغ التحمّل والتغطية الشاملة",
      intro: "يشمل كل إيجار تأميناً شاملاً. وعن كل مطالبة بأضرار تدفع ما لا يزيد على مبلغ التحمّل. وتخفّض التغطية الشاملة هذا المبلغ، وتغطي أيضاً الإطارات والجنوط والزجاج.",
      caption: "مبلغ التحمّل والتغطية الشاملة حسب الفئة",
      columns: ["الفئة", "مبلغ التحمّل", "التغطية الشاملة", "مبلغ التحمّل مع التغطية الشاملة"],
      withCoverShort: "مع التغطية الشاملة",
      exclusions: "لا يغطي التأمين",
      accident: "في حال وقوع حادث",
    },
    road: { eyebrow: "خلال فترة الإيجار", title: "الوقود والكيلومترات ورسوم الطرق والمخالفات", note: "جميع الرسوم مدرجة في [صفحة الأسعار](/pricing#fees) لدينا." },
    chauffeur: { eyebrow: "خدمة السائق الخاص", title: "حجوزات السائق الخاص", note: "الأسعار والسيارات متاحة في [صفحة السائق الخاص](/chauffeur)." },
    faq: { eyebrow: "أسئلة", title: "أسئلة عن المتطلبات", summaryNote: "هذه القواعد ملخص، ويتضمن عقد الإيجار الذي توقّعه عند التسليم الشروط الكاملة." },
    cta: {
      title: "لست متأكداً من رخصتك؟",
      text: "أخبرنا أين صدرت رخصتك وأي سيارة تريد، وسنتحقق منها عبر واتساب قبل أن ترسل طلبك.",
      whatsappText: `مرحباً ${site.businessName}، هل يمكنني الاستئجار برخصتي؟ صدرت في: `,
      whatsapp: "تحقق عبر واتساب",
      fleet: "تصفّح الأسطول",
    },
    inLanguage: "ar",
  },
};
