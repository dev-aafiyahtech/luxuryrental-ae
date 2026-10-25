import { cars, getCar } from "@/content/cars";
import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { getZone } from "@/content/zones";
import { chauffeurIncluded, localizeZone, siteFor } from "@/content/localize";
import type { Tier } from "@/content/types";
import { formatAED, formatNumber as n } from "@/lib/format";
import { advanceRule, refundWindows } from "./cancellation";
import {
  DEFAULT_MONTH_KM, carsInTier, chauffeurFromHourly, chauffeurNames, countText, depositRange, festiveDates, festiveMinDays,
  flagshipCars, hypercars, listJoin, monthKmFor, noticeText, peakWeekendMinDays, salikTariff, tierName,
} from "../shared";
import type { FaqEntry, FaqGroup, FaqPageContent } from "../faq";

// Arabic FAQ: the same groups, ids and order as ../faq.ts (other pages pick entries by id),
// every answer built from the rules and data modules. Demo translation for UAE readers,
// to be reviewed by a translator before launch. Answers use the copy mini-markup.
//
// Only types come from ../faq.ts (it imports this module), so there is no runtime cycle.

export type { FaqEntry, FaqGroup };

const A = "ar";
const s = siteFor(A);
const aed = (amount: number) => formatAED(amount, A);
const { L, S, H } = rules.tiers;
const c = rules.chauffeur;
const { from, to } = rules.handoverHours;
const dubai = getZone("dubai")!;
const dxb = localizeZone(getZone("dxb")!, A);
const shjAjm = localizeZone(getZone("sharjah-ajman")!, A);
const auh = localizeZone(getZone("abu-dhabi")!, A);
const other = localizeZone(getZone("other-emirates")!, A);
const phantom = getCar("rolls-royce-phantom")!;
/** "20 to 30" → "من 20 إلى 30" */
const span = (range: string) => range.replace(/^(\d+) to (\d+)$/, "من $1 إلى $2");

/** Brands in a tier, e.g. "Rolls-Royce، Bentley، Aston Martin و Maserati". */
function tierBrands(tier: Tier): string {
  const names: string[] = [];
  for (const car of carsInTier(tier)) {
    const brand = car.name.slice(0, car.name.length - car.model.length).trim();
    if (!names.includes(brand)) names.push(brand);
  }
  return listJoin(names, "and", A);
}

const baseMinDays = Math.min(...cars.map((car) => car.minDays));
const hyperMinDays = Math.min(...hypercars().map((car) => car.minDays));
const monthlyCars = cars.filter((car) => car.rates.monthly);
const monthKmExceptions = monthlyCars.filter((car) => car.rates.kmPerMonth && car.rates.kmPerMonth !== DEFAULT_MONTH_KM);
const monthsAhead = Math.round(rules.maxAdvanceDays / 30.4);
const sameLead = L.leadHours === S.leadHours;
const sameRelease = L.releaseDays === S.releaseDays;

export const faqGroups: FaqGroup[] = [
  {
    id: "booking",
    title: "الحجز",
    items: [
      {
        id: "how-booking-works",
        q: "كيف يتم الحجز؟",
        a: `اختر سيارة وتواريخك، ثم أرسل طلب حجز. الطلبات مجانية، ولا يُحصَّل أي مبلغ على هذا الموقع. يراجع فريقنا السيارة وبياناتك، ثم يؤكد الطلب عبر واتساب. ${s.replyPromise}\n\nلا يصبح حجزك مؤكداً إلا بعد أن نؤكده نحن. تدفع قيمة الإيجار عند التسليم، أو عبر رابط دفع آمن نرسله إليك بعد التأكيد.`,
      },
      {
        id: "notice",
        q: "كم من الوقت تحتاجون قبل موعد الاستلام؟",
        a: sameLead
          ? `**${noticeText(L.leadHours, A)}** للسيارات الفاخرة والخارقة، للتسليم بين ${from} و${to}. وتحتاج سيارات Bugatti إلى **${noticeText(H.leadHours, A)}** لنتمكن من التحقق من المستندات والتأمين، وتحتاج طلبات السائق الخاص إلى **${countText(c.leadHours, "hour", A)}**. ويمكنك تقديم طلبك قبل موعده بما يصل إلى ${countText(monthsAhead, "month", A)}.`
          : `**${noticeText(L.leadHours, A)}** للسيارات الفاخرة، و**${noticeText(S.leadHours, A)}** للسيارات الخارقة، و**${noticeText(H.leadHours, A)}** لسيارات Bugatti. وتحتاج طلبات السائق الخاص إلى **${countText(c.leadHours, "hour", A)}**. ويمكنك تقديم طلبك قبل موعده بما يصل إلى ${countText(monthsAhead, "month", A)}.`,
      },
      {
        id: "minimum-rental",
        q: "ما الحد الأدنى لمدة الإيجار؟",
        a: `الحد الأدنى ${countText(baseMinDays, "day", A, true)}، تُحتسب 24 ساعة من وقت التسليم، والإرجاع متأخراً حتى ${countText(rules.graceMinutes, "minute", A)} مجاني. وبعض السيارات والتواريخ تتطلب مدة أطول: الحد الأدنى لسيارات Bugatti ${countText(hyperMinDays, "day", A, true)}، ولأي سيارة تُستلم في ذروة الأعياد (${festiveDates(A)}) ${countText(festiveMinDays(), "day", A, true)}. وفي موسم الذروة تحتاج سياراتنا الرائدة (${listJoin(flagshipCars().map((car) => car.name), "and", A)}) إلى ${countText(peakWeekendMinDays(), "day", A)} عند الاستلام من الجمعة إلى الأحد.`,
      },
      {
        id: "monthly",
        q: "هل يمكنني استئجار سيارة لمدة شهر؟",
        a: `نعم. لكل سيارة، باستثناء سيارات Bugatti، سعر ثابت لمدة 30 يوماً لا يتغير طوال العام، ويشمل ${n(DEFAULT_MONTH_KM)} كم${monthKmExceptions.length ? ` (${monthKmExceptions.map((car) => `${n(monthKmFor(car))} كم على ${car.model}`).join("، ")})` : ""}. تعرض [صفحة الأسعار](/pricing) سعر 30 يوماً لكل سيارة. ويمكنك طلب ما يصل إلى ${countText(rules.maxOnlineDays, "day", A)} عبر الموقع؛ وللإيجارات الأطول، راسلنا عبر واتساب.`,
      },
    ],
  },
  {
    id: "requirements",
    title: "الشروط",
    items: [
      {
        id: "age",
        q: "كم يجب أن يكون عمري لاستئجار سيارة؟",
        a: `للسيارات الفاخرة (${tierBrands("L")})، يجب أن يكون السائق الرئيسي **بعمر ${countText(L.minAge, "age", A)} أو أكثر** ويحمل رخصة قيادة كاملة منذ ${countText(L.licenceYears, "year", A)} على الأقل. وتتطلب السيارات الخارقة (${tierBrands("S")}) أيضاً سائقاً **بعمر ${countText(S.minAge, "age", A)} أو أكثر** يحمل رخصته منذ ${countText(S.licenceYears, "year", A)}. أما سيارات Bugatti فتتطلب سائقاً **بعمر ${countText(H.minAge, "age", A)} أو أكثر** يحمل رخصته منذ ${countText(H.licenceYears, "year", A)}، إضافة إلى موافقة فريقنا وشركة التأمين.\n\nوتتطلب القيادة الذاتية لسيارة Rolls-Royce Phantom موافقتنا، وأن يكون عمر السائق ${countText(phantom.minAge, "age", A)} أو أكثر.`,
      },
      {
        id: "idp",
        q: "هل أحتاج إلى رخصة قيادة دولية؟",
        a: `يعتمد ذلك على البلد الذي أصدر رخصتك. يجب على المقيمين في الإمارات القيادة برخصة إماراتية. ويمكن للزوار القيادة برخصة صادرة من إحدى دول مجلس التعاون الخليجي، أو من دولة مدرجة في القائمة المعتمدة لدى هيئة الطرق والمواصلات، مثل المملكة المتحدة ودول الاتحاد الأوروبي والولايات المتحدة وكندا وأستراليا واليابان وكوريا الجنوبية وسنغافورة. أما الزوار الذين يحملون رخصة من أي دولة أخرى فيحتاجون إلى رخصة قيادة دولية إلى جانب رخصتهم الوطنية.\n\nأخبرنا ببلد إصدار رخصتك عند إرسال الطلب، وسنتحقق منها عبر واتساب قبل التأكيد.`,
      },
      {
        id: "documents",
        q: "ما المستندات التي أحتاج إلى إحضارها؟",
        a: `**الزوار:** جواز السفر، وختم الدخول إلى الإمارات أو صفحة التأشيرة، ورخصة القيادة، ورخصة القيادة الدولية إذا كنت تحتاج إليها. **المقيمون:** بطاقة الهوية الإماراتية ورخصة القيادة الإماراتية.\n\nأحضر المستندات الأصلية إلى موعد التسليم. نتحقق منها ونعيدها إليك فوراً، ولا نحتفظ أبداً بجواز سفرك أو بطاقة هويتك الإماراتية.`,
      },
      {
        id: "upload-documents",
        q: "هل يمكنني رفع مستنداتي قبل التسليم؟",
        a: `نعم، وهذا يجعل التسليم أسرع. بعد إرسال طلبك، افتح [صفحة حالة الطلب](/booking) أو [حسابك](/account) وأضف صورة أو ملف PDF لكل مستند. نراجعها قبل الموعد ونخبرك إذا احتاج أحدها إلى استبدال. وتبقى بحاجة إلى إحضار المستندات الأصلية إلى موعد التسليم.`,
      },
      {
        id: "agreement",
        q: "كيف أوقّع عقد الإيجار؟",
        a: `بعد أن نؤكد طلبك، يظهر عقد الإيجار في صفحة حالة الطلب. يمكنك قراءته وتوقيعه عبر الإنترنت بإصبعك أو بالفأرة أو بكتابة اسمك، أو توقيعه عند التسليم. وعند التسليم نفحص السيارة معك أيضاً، وتوقّع تقرير فحص السيارة.`,
      },
      {
        id: "account",
        q: "هل أحتاج إلى حساب؟",
        a: `لا. يمكنك إرسال طلب دون حساب ومتابعته عبر الرابط الذي نرسله إليك. أما [الحساب](/account) فيجمع طلباتك ومستنداتك وعقودك في مكان واحد. تسجّل الدخول برمز لمرة واحدة عبر واتساب أو البريد الإلكتروني، فلا توجد كلمة مرور تحتاج إلى تذكّرها.`,
      },
      {
        id: "additional-drivers",
        q: "هل يمكن لشخص آخر قيادة السيارة؟",
        a: `نعم، إذا استوفى شروط العمر والرخصة نفسها وذُكر اسمه في عقد الإيجار. تبلغ تكلفة كل سائق إضافي ${aed(rules.additionalDriverPerDay)} في اليوم. وإذا قاد السيارة شخص غير مذكور في العقد، فلا يغطيه التأمين.`,
      },
    ],
  },
  {
    id: "deposit",
    title: "مبلغ التأمين والدفع",
    items: [
      {
        id: "deposit-amount",
        q: "كم يبلغ مبلغ التأمين؟",
        a: `يعتمد على السيارة: ${depositRange(carsInTier("L"), A)} للسيارات الفاخرة، و${depositRange(carsInTier("S"), A)} للسيارات الخارقة، و${depositRange(carsInTier("H"), A)} لسيارات Bugatti. تعرض [صفحة الأسعار](/pricing) مبلغ التأمين لكل سيارة.\n\nيُحجز مبلغ التأمين على **بطاقة ائتمان باسم السائق الرئيسي** عند التسليم، ولا نقبل بطاقات الخصم المباشر أو النقد لمبلغ التأمين.`,
      },
      {
        id: "deposit-release",
        q: "متى أستعيد مبلغ التأمين؟",
        a: `نُفرج عن مبلغ التأمين المحجوز بعد ${sameRelease ? countText(L.releaseDays, "day", A) : `${countText(L.releaseDays, "day", A)} (${tierName("L", A)}) أو ${countText(S.releaseDays, "day", A)} (${tierName("S", A)})`} من إعادة السيارة، أو بعد ${countText(H.releaseDays, "day", A)} لسيارات Bugatti، بعد خصم أي مخالفات أو رسوم طرق أو رسوم أخرى. وقد يحتاج البنك بعد ذلك إلى ${span(rules.bankReleaseWorkingDays)} يوم عمل حتى يظهر المبلغ في حسابك. وإذا وصلت مخالفة بعد الإفراج عن المبلغ، نخصمها من البطاقة المسجلة ونرسل إليك إشعار المخالفة.`,
      },
      {
        id: "payment",
        q: "كيف أدفع قيمة الإيجار؟",
        a: `لا يُحصَّل أي مبلغ على هذا الموقع. بعد أن نؤكد حجزك، تدفع عند التسليم أو عبر رابط دفع آمن نرسله إليك. ${advanceRule}`,
      },
      {
        id: "vat",
        q: "هل تشمل أسعاركم ضريبة القيمة المضافة؟",
        a: `نعم. جميع الأسعار على هذا الموقع بالدرهم الإماراتي وتشمل ضريبة القيمة المضافة بنسبة ${site.vatRate}%، وتحصل على فاتورة ضريبية عن كل إيجار. تظهر رسوم التوصيل والإضافات في عرض السعر قبل أن ترسل الطلب. ويظهر مبلغ التأمين منفصلاً لأنه حجز مسترد على بطاقتك.`,
      },
    ],
  },
  {
    id: "insurance",
    title: "التأمين والمخالفات",
    items: [
      {
        id: "insurance",
        q: "هل التأمين مشمول؟",
        a: `نعم، يشمل كل إيجار تأميناً شاملاً. وعن كل مطالبة أضرار تدفع حتى مبلغ التحمّل: ${aed(L.excess)} للسيارات الفاخرة، و${aed(S.excess)} للسيارات الخارقة، و${aed(H.excess)} لسيارات Bugatti.\n\nلا يسري التأمين في حالات القيادة تحت تأثير الكحول أو المخدرات، أو قيادة سائق غير مذكور في العقد، أو السباقات أو استخدام الحلبات، أو القيادة على الطرق الوعرة أو الرمال، أو مغادرة الإمارات، أو الأضرار دون تقرير من الشرطة.`,
      },
      {
        id: "full-cover",
        q: "ماذا تضيف التغطية الشاملة؟",
        a: `تخفّض التغطية الشاملة مبلغ التحمّل إلى ${aed(L.fullCoverExcess)} مقابل ${aed(L.fullCoverPerDay)} في اليوم للسيارات الفاخرة، أو ${aed(S.fullCoverPerDay)} في اليوم للسيارات الخارقة. وفي سيارات Bugatti تخفّض مبلغ التحمّل إلى ${aed(H.fullCoverExcess)} مقابل ${aed(H.fullCoverPerDay)} في اليوم. كما تغطي الإطارات والجنوط والزجاج. أضفها عند إرسال طلبك.`,
      },
      {
        id: "salik",
        q: "كيف تُحتسب رسوم سالك؟",
        a: `سالك هو نظام تعرفة الطرق في دبي. تُحتسب كل مرة عبور بتعرفة سالك، ${salikTariff(A)}، إضافة إلى رسوم إدارية قدرها ${aed(rules.tollAdminFee)}. وتُحتسب رسوم درب في أبوظبي (${aed(rules.tolls.darbPeak)} في أوقات الذروة) بالطريقة نفسها. نخصمها من مبلغ التأمين قبل الإفراج عنه. وفي طلبات السائق الخاص، تكون رسوم سالك ودرب مشمولة في السعر.`,
      },
      {
        id: "fines",
        q: "ماذا يحدث إذا حصلت على مخالفة مرورية؟",
        a: `أنت مسؤول عن المخالفات المرورية ومخالفات المواقف خلال فترة الإيجار. نحتسب قيمة المخالفة مع رسوم إدارية قدرها ${aed(rules.fineAdminFee)} عن كل مخالفة. وحيثما تسمح الجهة المختصة، نحوّل المخالفة وأي نقاط سوداء إلى رخصة السائق.`,
      },
    ],
  },
  {
    id: "delivery",
    title: "التوصيل",
    items: [
      {
        id: "delivery-fee",
        q: "هل توصلون السيارة إلى الفنادق والمنازل؟",
        a: `نعم، إلى أي مكان في دبي. التوصيل واستلام السيارة منك مجانيان للإيجارات لمدة ${countText(dubai.freeFromDays ?? 0, "day", A)} أو أكثر، و${aed(dubai.fee ?? 0)} لكل اتجاه للإيجارات الأقصر. ولحتا والإمارات الأخرى والمطارات رسومها الخاصة، وتجدها في [صفحة التوصيل](/delivery).`,
      },
      {
        id: "airport",
        q: "هل يمكنكم استقبالي في المطار؟",
        a: `نعم، في مطار دبي الدولي (DXB، ${listJoin(dxb.areas, "and", A)}) أو مطار آل مكتوم الدولي (DWC). يكلف التسليم في المطار ${aed(dxb.fee ?? 0)}، ويشمل مواقف المطار والاستقبال في صالة الوصول. نتابع رحلتك الجوية، وأول ${countText(rules.airportWaitFreeMinutes, "minute", A)} بعد الهبوط مجانية، ثم يكلف الانتظار ${aed(rules.airportWaitPerHour)} عن كل ساعة أو جزء منها.`,
      },
      {
        id: "collect",
        q: "هل يمكنني استلام السيارة بنفسي؟",
        a: `نعم. يمكنك استلام السيارة وإعادتها في مكتبنا في [واحة دبي للسيليكون](/delivery/dubai-silicon-oasis) دون أي رسوم. اختر الاستلام من المكتب عند إرسال طلبك، وأحضر المستندات الأصلية للسائق الرئيسي.`,
      },
      {
        id: "hours",
        q: "ما أوقات التوصيل لديكم؟",
        a: `يتم التسليم من ${from} إلى ${to} يومياً. وخارج هذه الأوقات يمكننا التوصيل حسب التوفر، مقابل رسوم إضافية قدرها ${aed(rules.outOfHoursFee)} لكل عملية تسليم. نصل خلال ${countText(rules.slotToleranceMinutes, "minute", A)} من موعدك، ويستغرق التسليم ${span(rules.handoverMinutes)} دقيقة.`,
      },
    ],
  },
  {
    id: "chauffeur",
    title: "السائق الخاص",
    items: [
      {
        id: "chauffeur-cars",
        q: "ما السيارات المتاحة مع سائق خاص؟",
        a: `السيارات المتاحة مع سائق خاص هي ${chauffeurNames(A)}. ونقدّم Phantom أولاً مع سائق خاص، أما سياراتنا الرياضية ذات المقعدين فمتاحة بالقيادة الذاتية فقط. وتتسع كل سيارة مع سائق خاص لما يصل إلى ${countText(c.maxPassengers, "passenger", A)}.`,
      },
      {
        id: "chauffeur-cost",
        q: "كم تكلفة السائق الخاص؟",
        a: `تبدأ من ${aed(chauffeurFromHourly())} للساعة، بحد أدنى ${countText(c.minHours, "hour", A)}. ولنصف اليوم (${countText(c.halfDayHours, "hour", A)}) واليوم الكامل (${countText(c.fullDayHours, "hour", A)}) والتوصيل من المطار باتجاه واحد أسعار ثابتة، تجدها كلها في [صفحة السائق الخاص](/chauffeur). وتزيد تكلفة الرحلات التي تبدأ بين 00:00 و06:00 بنسبة ${c.nightSurchargePct}%، والطلبات في ذروة الأعياد (${festiveDates(A)}) بنسبة ${c.superPeakSurchargePct}%.`,
      },
      {
        id: "chauffeur-included",
        q: "ماذا يشمل سعر السائق الخاص؟",
        a: `${chauffeurIncluded(A)} ويُحتسب وقت الانتظار ضمن الوقت المطلوب، وتُدفع رسوم المواقف بتكلفتها الفعلية. ومقاعد الأطفال مجانية عند الطلب.`,
      },
      {
        id: "chauffeur-emirates",
        q: "هل يمكن للسائق أن يأخذنا إلى أبوظبي أو الشارقة؟",
        a: `نعم. تُحتسب رحلات السائق الخاص بالوقت، لذا يناسب اليوم في أبوظبي أو الإمارات الشمالية عادةً طلب نصف يوم (${countText(c.halfDayHours, "hour", A)}) أو يوم كامل (${countText(c.fullDayHours, "hour", A)}). وتضيف الطلبات التي تبدأ في ${shjAjm.name} ${aed(shjAjm.chauffeurSurcharge ?? 0)}، وفي ${auh.name} ${aed(auh.chauffeurSurcharge ?? 0)}، وفي ${listJoin(other.areas, "and", A)} ${aed(other.chauffeurSurcharge ?? 0)}. أرسل لنا المسار مع طلبك لنخطط اليوم.`,
      },
    ],
  },
  {
    id: "cancellation",
    title: "الإلغاء",
    items: [
      {
        id: "cancel-request",
        q: "هل يمكنني إلغاء طلب الحجز؟",
        a: `نعم، في أي وقت قبل أن نؤكده، ودون أي تكلفة. أرسل لنا رقم طلبك عبر واتساب أو البريد الإلكتروني.\n\nهل تحتاج إلى تواريخ مختلفة بدلاً من ذلك؟ يحصل كل حجز مؤكد على تغيير مجاني واحد للتواريخ حتى ${countText(rules.freeDateChangeHours, "hour", A)} قبل البدء، حسب التوفر. ويُطبَّق أي فرق في السعر.`,
      },
      {
        id: "refunds",
        q: "كم أسترد إذا ألغيت حجزاً مؤكداً؟",
        a: [
          "يعتمد ذلك على مدى قرب الإلغاء من موعد البدء. نردّ الدفعة المقدّمة على النحو التالي:",
          ...refundWindows.map((w) => `**${w.label}:** استرداد 100% عند الإلغاء ${w.full}، و50% عند الإلغاء ${w.half}، ولا استرداد عند الإلغاء ${w.none}.`),
          "تجد الشروط الكاملة في [سياسة الإلغاء](/legal/cancellation).",
        ].join("\n\n"),
      },
      {
        id: "flight-weather",
        q: "ماذا لو تأخرت رحلتي الجوية أو أُلغيت؟",
        a: `إذا منعك تأخر رحلتك أو إلغاؤها، أو تحذير رسمي من سوء الأحوال الجوية، من بدء الإيجار، يمكنك نقل تواريخك مجاناً خلال ${countText(rules.flightChangeMonths, "month", A)} أو استرداد المبلغ بالكامل. ونطلب إثباتاً، مثل إشعار شركة الطيران أو تحذير من المركز الوطني للأرصاد.`,
      },
      {
        id: "we-cancel",
        q: "ماذا لو لم تتمكنوا من توفير سيارتي؟",
        a: `إذا ألغينا الحجز أو لم نتمكن من توفير السيارة التي طلبتها، تختار بين استرداد المبلغ كاملاً أو سيارة مماثلة أو أفضل دون تكلفة إضافية. وتُعاد المبالغ المستردة إلى وسيلة الدفع الأصلية خلال ${countText(rules.refundWorkingDays, "day", A)} عمل.`,
      },
    ],
  },
];

/** All FAQ entries, flat. */
export const allFaqs = faqGroups.flatMap((g) => g.items);

/** Pick entries by id (throws on a typo, so a renamed question fails the build). */
export function faqsById(...ids: string[]): FaqEntry[] {
  return ids.map((id) => {
    const item = allFaqs.find((f) => f.id === id);
    if (!item) throw new Error(`ar/faq.ts: unknown question ${id}`);
    return item;
  });
}

export const faqCount = allFaqs.length;

/** Copy for the /ar/faq page itself. */
export const faqPage: FaqPageContent = {
  metaTitle: "الأسئلة الشائعة عن تأجير السيارات الفاخرة",
  crumb: "الأسئلة الشائعة",
  eyebrow: (count: number) => `الأسئلة الشائعة · ${countText(count, "answer", A, true)}`,
  title: "كيف يتم الاستئجار معنا؟",
  lede: [
    "إجابات عن الحجز والشروط ومبلغ التأمين والتأمين على السيارة والتوصيل وخدمة السائق الخاص والإلغاء.",
    "كل رقم هنا يطابق صفحتَي [الأسعار](/pricing) و[شروط الإيجار](/requirements).",
  ],
  whatsappText: `مرحباً ${site.businessName}، لدي سؤال.`,
  topicsLabel: "مواضيع الأسئلة الشائعة",
  topics: "المواضيع",
  groupCount: (count: number) => countText(count, "question", A, true),
  ctaTitle: "لديك سؤال آخر؟",
  ctaText: "راسلنا عبر واتساب بالسيارة والتواريخ التي تفكر فيها، ونجيبك بالمعلومات التي تخص رحلتك.",
};
