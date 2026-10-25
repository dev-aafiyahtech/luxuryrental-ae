import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { getZone } from "@/content/zones";
import { localizeZone } from "@/content/localize";
import { formatAED } from "@/lib/format";
import { faqsById, type FaqEntry } from "./faq";
import { chauffeurFromHourly, chauffeurNames, countText, festiveDates, listJoin, seatsText } from "../shared";
import type { ChauffeurPageContent } from "../chauffeur";

// Arabic copy for /ar/chauffeur: the same shape as ../chauffeur.ts. Rates come from each
// car's `chauffeur` block; rules from rules.chauffeur and zones.ts. Demo translation.

const A = "ar";
const c = rules.chauffeur;
const aed = (amount: number) => formatAED(amount, A);
const hours = (n: number, nominative = false) => countText(n, "hour", A, nominative);
const shjAjm = localizeZone(getZone("sharjah-ajman")!, A);
const auh = localizeZone(getZone("abu-dhabi")!, A);
const other = localizeZone(getZone("other-emirates")!, A);

export const chauffeurPage: ChauffeurPageContent = {
  meta: {
    title: "خدمة السائق الخاص في دبي: Rolls-Royce و Bentley مع سائق",
    description: () => `خدمة سائق خاص من ${aed(chauffeurFromHourly())} للساعة: الاستقبال من المطار وحفلات الزفاف وأيام العمل في Rolls-Royce Phantom أو Cullinan أو Bentley Bentayga في أنحاء دبي.`,
  },
  hero: {
    eyebrow: "خدمة السائق الخاص",
    title: "خدمة السائق الخاص في دبي",
    lede: () => [
      `اطلب ${chauffeurNames(A)} مع سائق. اختر الحجز بالساعة بحد أدنى ${hours(c.minHours)}، أو نصف يوم أو يوماً كاملاً، أو توصيلاً واحداً من المطار أو إليه.`,
      "الوقود ورسوم سالك ودرب مشمولة في السعر، وينتظرك السائق بينما تعمل أو تتسوّق أو تحتفل.",
    ],
  },
  steps: [
    { title: "اختر السيارة والوقت", text: () => `اختر السيارة، ثم الحجز بالساعة (${hours(c.minHours)} أو أكثر)، أو نصف يوم، أو يوماً كاملاً، أو توصيلاً من المطار. أرسل طلبك قبل ${hours(c.leadHours)} على الأقل.` },
    { title: "أرسل الطلب", text: () => "أضف عنوان الاستلام ووقته، والمسار إن كنت تعرفه، ورقم رحلتك الجوية عند الاستقبال من المطار. لا يُحصَّل أي مبلغ على هذا الموقع." },
    { title: "نؤكد عبر واتساب", text: () => "نتحقق من توفر السيارة والسائق في الوقت الذي تختاره، ثم نؤكد السعر عبر واتساب. وفي اليوم المحدد، يلتقيك السائق في نقطة الاستلام." },
  ],
  surcharges: () => [
    { label: "الرحلات التي تبدأ بين 00:00 و06:00", value: `+${c.nightSurchargePct}%` },
    { label: `ذروة الأعياد، ${festiveDates(A)}`, value: `+${c.superPeakSurchargePct}%` },
    { label: shjAjm.name, value: `+${aed(shjAjm.chauffeurSurcharge ?? 0)}` },
    { label: auh.name, value: `+${aed(auh.chauffeurSurcharge ?? 0)}` },
    { label: listJoin(other.areas, "and", A), value: `+${aed(other.chauffeurSurcharge ?? 0)}` },
  ],
  goodToKnow: () => [
    "يُحتسب وقت الانتظار ضمن الوقت المطلوب.",
    `يعمل السائق الواحد حتى ${hours(c.maxHours)} في اليوم.`,
    `حتى ${countText(c.maxPassengers, "passenger", A)} في كل سيارة. ومقاعد الأطفال مجانية عند الطلب.`,
    "تُدفع رسوم المواقف بتكلفتها الفعلية.",
    "يلتزم السائق بقوانين المرور في الإمارات، وله أن يرفض أي طلب غير آمن أو مخالف للقانون.",
  ],
  faqs: (): FaqEntry[] => [
    {
      id: "wedding",
      q: "هل يمكنني طلب سائق خاص لحفل زفاف؟",
      a: "نعم. نقترح Phantom لحفلات الزفاف. اطلب نصف يوم أو يوماً كاملاً لتنتظر السيارة بين المراسم والتصوير وحفل الاستقبال، لأن وقت الانتظار يُحتسب ضمن الوقت المطلوب. أرسل لنا أماكن المناسبة ومواعيدها عبر واتساب ونقترح عليك الباقة المناسبة.",
    },
    {
      id: "airport-transfer",
      q: "كيف يعمل التوصيل من المطار وإليه؟",
      a: `التوصيل من المطار رحلة واحدة بسعر ثابت بين مطار دبي الدولي (DXB) أو مطار آل مكتوم الدولي (DWC) وأي مكان في دبي. أضف رقم رحلتك الجوية إلى الطلب. يتابع السائق رحلتك ويستقبلك في صالة الوصول، وأول ${countText(rules.airportWaitFreeMinutes, "minute", A)} بعد الهبوط مجانية.`,
    },
    {
      id: "overtime",
      q: "ماذا لو احتجنا إلى السيارة لوقت أطول؟",
      a: `أخبر السائق. يُحتسب الوقت الإضافي بسعر الساعة الإضافية للسيارة في الجدول أعلاه، عن كل ${countText(c.overtimeStepMinutes, "minute", A)} أو جزء منها، ما دام يوم عمل السائق البالغ ${hours(c.maxHours)} يسمح بذلك. وإذا كنت تعرف مسبقاً أن اليوم سيطول، فاليوم الكامل (${hours(c.fullDayHours)}) أقل تكلفة عادةً.`,
    },
    ...faqsById("chauffeur-emirates"),
  ],
  ui: {
    crumb: "خدمة السائق الخاص",
    serviceType: "استئجار سيارات فاخرة مع سائق خاص",
    offerName: (car: string) => `${car} مع سائق خاص`,
    city: "دبي",
    chooseCar: "اختر سيارتك",
    whatsappText: `مرحباً ${site.businessName}، أرغب في طلب سائق خاص.`,
    factsLabel: "خدمة السائق الخاص باختصار",
    facts: (fromHourly: number, fromAirport: number) => [
      { label: "تبدأ من", value: `${aed(fromHourly)} / ساعة`, note: `حد أدنى ${hours(c.minHours)}` },
      { label: "التوصيل من المطار", value: `من ${aed(fromAirport)}`, note: "DXB أو DWC، باتجاه واحد داخل دبي" },
      { label: "الإشعار المسبق", value: hours(c.leadHours, true), note: "تحتاجه أسرع؟ اسألنا عبر واتساب" },
      { label: "الركاب", value: `حتى ${countText(c.maxPassengers, "passenger", A)}`, note: "مقاعد الأطفال مجانية عند الطلب" },
    ],
    howEyebrow: "كيف تعمل الخدمة",
    howTitle: "ثلاث خطوات إلى المقعد الخلفي",
    stepsLabel: "كيف يتم طلب السائق الخاص",
    ratesEyebrow: "الأسعار",
    ratesTitle: "أسعار السائق الخاص",
    ratesIntro: () => `أسعار ثابتة بالدرهم الإماراتي، شاملة ضريبة القيمة المضافة بنسبة ${site.vatRate}%، للرحلات داخل دبي. تمتد الطلبات بالساعة من ${hours(c.minHours)} إلى ${hours(c.maxHours)}.`,
    tableCaption: "أسعار السائق الخاص حسب السيارة",
    col: {
      car: "السيارة",
      perHour: "للساعة",
      perHourNote: `حد أدنى ${hours(c.minHours)}`,
      halfDay: "نصف يوم",
      halfDayNote: hours(c.halfDayHours, true),
      fullDay: "يوم كامل",
      fullDayNote: hours(c.fullDayHours, true),
      airport: "التوصيل من المطار",
      airportNote: "باتجاه واحد",
      extra: "ساعة إضافية",
      extraNote: `عن كل ${countText(c.overtimeStepMinutes, "minute", A)} أو جزء منها`,
    },
    seats: (seats: string) => seatsText(seats, A),
    tableFootnote: () => `يكون التوصيل من المطار بين DXB أو DWC وأي مكان في دبي، مع انتظار مجاني لمدة ${countText(rules.airportWaitFreeMinutes, "minute", A)} بعد الهبوط. وتجد أدناه الرسوم الإضافية للرحلات الليلية وذروة الأعياد والإمارات الأخرى.`,
    offerNote: "ينطبق على طلبات نصف اليوم واليوم الكامل خارج ذروة الأعياد، وتُخصم الساعة المجانية بسعر الساعة للسيارة.",
    includedEyebrow: "ما تحصل عليه",
    includedTitle: "ما هو مشمول، وما يُحتسب إضافياً",
    inEvery: "في كل طلب",
    surchargesTitle: "رسوم إضافية",
    surchargesNote: "تُطبَّق النسب المئوية على سعر الطلب، وتُطبَّق رسوم المناطق خارج دبي على الطلبات التي تبدأ في تلك المنطقة.",
    carsEyebrow: "السيارات",
    carsTitle: "اختر سيارتك",
    carsIntro: "نقدّم Phantom أولاً مع سائق خاص. ويمكن أيضاً استئجار Cullinan و Bentayga بالقيادة الذاتية من صفحات الأسطول.",
    imagesNote: "صور السيارات توضيحية إلى أن تجهز صور سياراتنا الفعلية.",
    faqTitle: "أسئلة عن السائق الخاص",
    ctaTitle: "خطّط ليومك معنا",
    ctaText: "أرسل لنا التاريخ ونقطة الاستلام والأماكن التي تريد الوصول إليها. نقترح عليك السيارة والباقة، ونؤكد السعر عبر واتساب.",
    request: "اطلب سائقاً خاصاً",
  },
};
