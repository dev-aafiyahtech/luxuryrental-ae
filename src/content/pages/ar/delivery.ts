import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { getZone, zones } from "@/content/zones";
import { localizeZone, siteFor } from "@/content/localize";
import { formatAED } from "@/lib/format";
import { faqsById, type FaqEntry } from "./faq";
import { chauffeurFromAirport, countText, listJoin, ltr, noticeText } from "../shared";
import type { AreaPage, DeliveryPageContent } from "../delivery";

// Arabic copy for /ar/delivery and the two area pages: the same shapes, slugs and FAQ ids as
// ../delivery.ts. Fees come from zones.ts and rules.ts. Demo translation for UAE readers.

export type { AreaPage };

const A = "ar";
const s = siteFor(A);
const aed = (amount: number) => formatAED(amount, A);
const minutes = (n: number, nominative = false) => countText(n, "minute", A, nominative);
const dubai = getZone("dubai")!;
const dso = localizeZone(getZone("dso")!, A);
const dxbEn = getZone("dxb")!;
const dxb = localizeZone(dxbEn, A);
const { from, to } = rules.handoverHours;
const { L, H } = rules.tiers;
const freeDays = countText(dubai.freeFromDays ?? 0, "day", A);
/** "20 to 30" → "من 20 إلى 30" */
const span = (range: string) => range.replace(/^(\d+) to (\d+)$/, "من $1 إلى $2");
const handoverTime = `${span(rules.handoverMinutes)} دقيقة`;
const hoursRange = ltr(`${from}–${to}`, A);

/** "150 درهم", "مجاناً", "عند الطلب" for a zone fee. */
export const zoneFee = (fee: number | null) => (fee === null ? "عند الطلب" : fee === 0 ? "مجاناً" : aed(fee));

export const deliveryPage: DeliveryPageContent = {
  meta: {
    title: "توصيل السيارات في دبي: المناطق والرسوم والتسليم في المطار",
    description: () => `توصيل إلى أي مكان في دبي، مجاناً للإيجارات لمدة ${freeDays} أو أكثر. استقبال في مطارَي DXB و DWC مقابل ${aed(dxbEn.fee ?? 0)}. التسليم يومياً من ${from} إلى ${to}.`,
  },
  hero: {
    eyebrow: "التوصيل والاستلام",
    title: "توصيل السيارة واستلامها في أنحاء دبي",
    lede: () => [
      "نوصل السيارة إلى فندقك أو منزلك أو مكتبك، أو نستقبلك في صالة الوصول في DXB أو DWC، ونستلمها منك أينما تنهي رحلتك.",
      `داخل دبي، الخدمة مجانية للإيجارات لمدة ${freeDays} أو أكثر.`,
    ],
  },
  facts: () => [
    { label: "أي مكان في دبي", value: `مجاناً من ${freeDays}`, note: `${aed(dubai.fee ?? 0)} لكل اتجاه للإيجارات الأقصر` },
    { label: "المطارات", value: aed(dxbEn.fee ?? 0), note: "لكل عملية تسليم في DXB أو DWC" },
    { label: "أوقات التسليم", value: hoursRange, note: `خارج هذه الأوقات تُضاف ${aed(rules.outOfHoursFee)}` },
    { label: "الاستلام بنفسك", value: zoneFee(dso.fee), note: "في مكتبنا في واحة دبي للسيليكون" },
  ],
  base: () => [
    `تبدأ كل سيارة يومها من مكتبنا في ${dso.areas[0]}، بجوار طريق دبي–العين (E66) وشارع الشيخ محمد بن زايد (E311). ومن هناك تبعد نحو 20 كم عن وسط مدينة دبي أو مطار دبي الدولي.`,
    "نخطط التوصيل وفق الوقت الذي تختاره. ويمكنك أيضاً استلام السيارة من المكتب بنفسك دون أي رسوم.",
  ],
  handover: () => [
    { title: "في الموعد", text: `نصل خلال ${minutes(rules.slotToleranceMinutes)} من الوقت الذي تختاره، والسيارة نظيفة ومفحوصة.` },
    { title: "حضور السائق الرئيسي", text: `يجب أن يحضر السائق الرئيسي ومعه المستندات الأصلية. يستغرق التسليم ${handoverTime}، بما في ذلك صور حالة السيارة وحجز مبلغ التأمين.` },
    { title: "أعدها في أي مكان", text: "يمكنك إعادة السيارة في مكان مختلف عن مكان استلامها، وتُطبَّق رسوم تلك المنطقة على استلامها منك." },
    { title: "مبكراً أو متأخراً", text: `يكلف التسليم بين ${to} و${from} مبلغاً إضافياً قدره ${aed(rules.outOfHoursFee)}، حسب التوفر. اسألنا عبر واتساب عن الرحلات الجوية المبكرة جداً.` },
  ],
  faqs: (): FaqEntry[] => [
    {
      id: "return-elsewhere",
      q: "هل يمكنني إعادة السيارة في مكان آخر؟",
      a: `نعم. اختر مكاناً مختلفاً للإرجاع في طلبك. تُطبَّق رسوم تلك المنطقة على استلام السيارة منك، والإرجاع في مكتبنا في ${dso.areas[0]} مجاني.`,
    },
    {
      id: "outside-dubai",
      q: "هل توصلون خارج دبي؟",
      a: `نعم. ${zones.filter((z) => z.kind === "zone" && z.fee && z.slug !== "dubai").map((z) => `${localizeZone(z, A).name}: ${aed(z.fee!)} لكل اتجاه`).join(". ")}. اطلب هذه المناطق قبل 24 ساعة على الأقل. ويكلف التسليم في مطار أبوظبي (AUH) أو مطار الشارقة (SHJ) المبلغ نفسه المحدد للإمارة.`,
    },
    {
      id: "in-person",
      q: "هل يجب أن أكون حاضراً بنفسي؟",
      a: "نعم. يجب أن يحضر السائق الرئيسي التسليم ومعه رخصته الأصلية وجواز سفره أو بطاقة الهوية الإماراتية، وبطاقة الائتمان لمبلغ التأمين. نتحقق من المستندات ونعيدها إليه فوراً.",
    },
    ...faqsById("collect", "hours"),
  ],
  zoneFee,
  ui: {
    crumb: "التوصيل",
    airportHandover: "التسليم في المطار",
    factsLabel: "التوصيل باختصار",
    zonesEyebrow: "المناطق والرسوم",
    zonesTitle: "أين نوصل، وكم يكلف ذلك",
    zonesIntro: () => `الرسوم لكل عملية تسليم، لذا يُحتسب التوصيل والاستلام عمليتين. جميع المبالغ بالدرهم الإماراتي، شاملة ضريبة القيمة المضافة بنسبة ${site.vatRate}%.`,
    zonesCaption: "رسوم التوصيل والاستلام حسب المنطقة",
    col: { zone: "المنطقة", areas: "المناطق المشمولة", fee: "الرسوم لكل اتجاه", note: "معلومات مفيدة" },
    freeFrom: (days: number) => `مجاناً من ${countText(days, "day", A)}`,
    chauffeurAdds: (fee: number) => `تضيف طلبات السائق الخاص هنا ${aed(fee)}.`,
    anyLength: "لكل اتجاه، أياً كانت مدة الإيجار.",
    zonesFootnote: () => `يُضاف ${aed(rules.outOfHoursFee)} لكل عملية تسليم خارج الفترة ${hoursRange}. ويكلف التسليم في مطارَي أبوظبي (AUH) والشارقة (SHJ) المبلغ نفسه المحدد لإمارة كل منهما.`,
    offerNote: "لا يشمل سيارات Bugatti.",
    baseEyebrow: "مقرنا",
    baseTitle: "كل شيء يبدأ من واحة دبي للسيليكون",
    collectLink: "استلم من مكتبنا",
    airportsEyebrow: "المطارات",
    airportsTitle: "الاستقبال في مطارَي DXB و DWC",
    airportsIntro: () => `نتابع رحلتك الجوية ونستقبلك في صالة الوصول. مواقف المطار مشمولة، وأول ${minutes(rules.airportWaitFreeMinutes)} بعد الهبوط مجانية.`,
    airportHandoverLabel: "التسليم",
    freeWaiting: "الانتظار المجاني",
    freeWaitingValue: () => minutes(rules.airportWaitFreeMinutes, true),
    then: "بعد ذلك",
    perStartedHour: () => `${aed(rules.airportWaitPerHour)} عن كل ساعة أو جزء منها`,
    dxbLink: "كيف يتم التسليم في DXB",
    handoverEyebrow: "الأوقات والتسليم",
    handoverTitle: () => `التسليم يومياً من ${from} إلى ${to}`,
    faqTitle: "أسئلة عن التوصيل",
    more: (airport: string, office: string) => `لمزيد من التفاصيل: [التسليم في مطار دبي الدولي](/delivery/${airport}) و[الاستلام في واحة دبي للسيليكون](/delivery/${office}).`,
    ctaTitle: "اختر السيارة، ونحن نوصلها",
    ctaText: "اختر سيارة وتواريخك، وأضف عنوان التوصيل أو رقم رحلتك الجوية، ثم أرسل الطلب. تظهر رسوم التوصيل في عرض السعر قبل الإرسال.",
    whatsappText: `مرحباً ${site.businessName}، لدي سؤال عن التوصيل.`,
    glance: (name: string) => `${name} باختصار`,
    allZones: "جميع مناطق التوصيل",
    seeAlso: (name: string, slug: string) => `تجد جميع المناطق والرسوم في [صفحة التوصيل](/delivery). واطّلع أيضاً على [${name}](/delivery/${slug}).`,
  },
};

export const areaPages: AreaPage[] = [
  {
    slug: "dubai-airport-dxb",
    zone: "dxb",
    name: "مطار دبي الدولي (DXB)",
    meta: {
      title: "تأجير السيارات الفاخرة في مطار دبي الدولي (DXB): التوصيل والتسليم",
      description: () => `سيارتك في ${listJoin(dxb.areas, "and", A)} بمطار دبي الدولي مقابل ${aed(dxb.fee ?? 0)}: الاستقبال في صالة الوصول ومواقف المطار ومتابعة الرحلة مشمولة، مع انتظار مجاني لمدة ${minutes(rules.airportWaitFreeMinutes)}.`,
    },
    eyebrow: "التسليم في المطار",
    title: "سيارات فاخرة تصلك إلى مطار دبي الدولي (DXB)",
    lede: () => [
      `نستقبلك في صالة الوصول في ${listJoin(dxb.areas, "and", A)}، ونرافقك إلى السيارة في مواقف المطار ونسلّمك إياها هناك.`,
      `يكلف التسليم ${aed(dxb.fee ?? 0)}، شاملاً المواقف والاستقبال. نتابع رحلتك الجوية، فإذا تأخر هبوطك نعيد ترتيب موعدنا ولا تتحمّل أنت ذلك.`,
    ],
    facts: () => [
      { label: "رسوم التسليم", value: aed(dxb.fee ?? 0), note: "تشمل المواقف والاستقبال" },
      { label: "الانتظار المجاني", value: minutes(rules.airportWaitFreeMinutes, true), note: `ثم ${aed(rules.airportWaitPerHour)} عن كل ساعة أو جزء منها` },
      { label: "المباني", value: dxbEn.areas.map((a) => a.replace("Terminal ", "T")).join("، "), note: "صالة الوصول" },
      { label: "المسافة من مقرنا", value: "نحو 20 كم", note: "واحة دبي للسيليكون" },
    ],
    steps: [
      { title: "أضف رقم رحلتك", text: () => "اكتب رقم رحلتك الجوية والمبنى في الطلب. وإذا كنت ستهبط في مطار آل مكتوم الدولي بدلاً من ذلك، فاختر DWC؛ الرسوم نفسها." },
      { title: "نتابع رحلتك", text: () => `نتابع رحلتك في يوم السفر، فإذا هبطت الطائرة مبكراً أو متأخراً يتغير موعد اللقاء معها. وتبدأ مدة الانتظار المجانية (${minutes(rules.airportWaitFreeMinutes, true)}) لحظة هبوط الطائرة.` },
      { title: "التقِ بنا في صالة الوصول", text: () => "بعد الجوازات واستلام الأمتعة، اخرج إلى صالة الوصول. يستقبلك مندوبنا هناك ويرافقك إلى السيارة." },
      { title: "الفحص والتوقيع", text: () => `نتحقق من المستندات الأصلية للسائق الرئيسي، ونلتقط صور حالة السيارة، ونسجّل قراءة العداد ومستوى الوقود، ونحجز مبلغ التأمين. يستغرق ذلك ${handoverTime}.` },
      { title: "انطلق", text: () => "تغادر ومعك عقد الإيجار ورقم واتساب الخاص بنا لأي شيء تحتاج إليه خلال فترة الإيجار." },
    ],
    faqs: () => [
      {
        id: "dxb-delay",
        q: "ماذا لو تأخرت رحلتي؟",
        a: `نتابع الرحلة، فإذا تأخرت يتغير موعد اللقاء معها دون أي تكلفة. وتبدأ مدة الانتظار المجانية (${minutes(rules.airportWaitFreeMinutes, true)}) لحظة هبوطك. وإذا استغرقت إجراءات الجوازات والأمتعة وقتاً أطول، يكلف الانتظار ${aed(rules.airportWaitPerHour)} عن كل ساعة أو جزء منها؛ راسلنا عبر واتساب إذا تأخرت.`,
      },
      {
        id: "dxb-return",
        q: "هل يمكنني إعادة السيارة في مطار دبي الدولي قبل رحلتي؟",
        a: `نعم. اختر DXB مكاناً للإرجاع، وأخبرنا بمبنى المغادرة وموعد رحلتك. نلتقيك عند المبنى ونفحص السيارة معاً. ويكلف تسليم الإرجاع أيضاً ${aed(dxb.fee ?? 0)}. خصّص له 30 دقيقة إضافة إلى موعد إنهاء إجراءات السفر لدى شركة الطيران.`,
      },
      {
        id: "dxb-terminal",
        q: "في أي مبنى سأصل؟",
        a: "تستخدم طيران الإمارات المبنى 3، وتستخدم فلاي دبي المبنيين 2 و3، فيما تستخدم معظم شركات الطيران الأخرى المبنى 1. تجد المبنى في تذكرتك أو في تطبيق شركة الطيران؛ أضفه إلى طلبك ونستقبلك هناك.",
      },
      {
        id: "dxb-chauffeur",
        q: "هل يمكن أن يستقبلني سائق خاص بدلاً من ذلك؟",
        a: `نعم. يبدأ التوصيل مع سائق خاص من DXB أو DWC إلى أي مكان في دبي من ${aed(chauffeurFromAirport())} باتجاه واحد، مع انتظار مجاني لمدة ${minutes(rules.airportWaitFreeMinutes)}. اطّلع على [خدمة السائق الخاص](/chauffeur).`,
      },
    ],
    whatsappText: `مرحباً ${site.businessName}، لدي سؤال عن التسليم في مطار دبي الدولي.`,
    howEyebrow: "التسليم",
    howTitle: "من الطائرة إلى مقعد السائق",
    faqTitle: "أسئلة عن مطار دبي الدولي",
    cta: { title: "اهبط وانطلق", text: "اختر سيارة، وحدّد DXB مكاناً للتسليم، وأضف رقم رحلتك. تظهر رسوم المطار في عرض السعر قبل أن ترسل الطلب." },
    terminals: {
      eyebrow: "المباني",
      title: "أي مبنى، وأين نلتقي",
      intro: "تجد المبنى في تذكرتك أو في تطبيق شركة الطيران. أضفه إلى طلبك ونستقبلك في صالة الوصول في ذلك المبنى.",
      rows: [
        { t: "المبنى 1", a: "معظم شركات الطيران الدولية" },
        { t: "المبنى 2", a: "فلاي دبي وبعض شركات الطيران الإقليمية" },
        { t: "المبنى 3", a: "طيران الإمارات وبعض رحلات فلاي دبي" },
      ],
    },
  },
  {
    slug: "dubai-silicon-oasis",
    zone: "dso",
    name: "واحة دبي للسيليكون",
    meta: {
      title: "تأجير السيارات الفاخرة في واحة دبي للسيليكون: التوصيل والتسليم",
      description: () => `استلم سيارتك وأعدها في مكتبنا في واحة دبي للسيليكون دون أي رسوم، بموعد مسبق. نعمل ${s.hours}، ومن هنا يبدأ التوصيل إلى أنحاء دبي.`,
    },
    eyebrow: "مكتبنا",
    title: "استلم سيارتك في واحة دبي للسيليكون",
    lede: () => [
      "مكتبنا في واحة دبي للسيليكون هو المكان الذي نجهّز فيه السيارات، ومنه تنطلق كل عملية توصيل.",
      "يمكنك استلام سيارتك وإعادتها هنا دون أي رسوم. حدّد موعداً مع طلبك وستجد السيارة جاهزة عند الباب.",
    ],
    facts: () => [
      { label: "الاستلام والإرجاع", value: zoneFee(dso.fee), note: "بموعد مسبق" },
      { label: "ساعات العمل", value: ltr(site.hours.replace(/^Daily /, ""), A), note: "كل يوم" },
      { label: "الإشعار المسبق", value: noticeText(L.leadHours, A), note: `${noticeText(H.leadHours, A)} لسيارات Bugatti` },
      { label: "العنوان", value: s.address.line1, note: `${s.address.area}، ${s.address.city}` },
    ],
    steps: [
      { title: "اختر الاستلام من المكتب", text: () => "اختر السيارة وتواريخك، وحدّد الاستلام من واحة دبي للسيليكون، ثم اختر الوقت. نؤكد الموعد عبر واتساب." },
      { title: "أحضر مستنداتك", text: () => "يحضر السائق الرئيسي رخصة القيادة الأصلية، وجواز السفر أو بطاقة الهوية الإماراتية، ورخصة القيادة الدولية إذا لزم الأمر، وبطاقة الائتمان لمبلغ التأمين." },
      { title: "التسليم في المكتب", text: () => `نتفقّد السيارة معك، ونلتقط صور حالتها، ونحجز مبلغ التأمين. يستغرق ذلك ${handoverTime}.` },
      { title: "أعدها هنا، أو في أي مكان", text: () => "أعد السيارة إلى المكتب دون أي رسوم، أو اختر منطقة توصيل للإرجاع ونستلمها منك." },
    ],
    faqs: () => [
      {
        id: "dso-appointment",
        q: "هل أحتاج إلى موعد للاستلام؟",
        a: `نعم. اختر الاستلام من المكتب ووقتاً مناسباً في طلبك، ونؤكد الموعد عبر واتساب. وتحتاج السيارات الفاخرة والخارقة إلى إشعار مسبق مدته ${noticeText(L.leadHours, A)}.`,
      },
      {
        id: "dso-where",
        q: "أين يقع المكتب بالضبط؟",
        a: `${s.address.line1}، ${s.address.area}، ${s.address.city}. ${s.address.directions} [افتحه في خرائط Google](${site.address.mapUrl}).`,
      },
      {
        id: "dso-live-nearby",
        q: "أسكن في واحة دبي للسيليكون. هل توصلون السيارة إلى بابي؟",
        a: `نعم. يخضع التوصيل إلى منزلك لسعر دبي: مجاناً للإيجارات لمدة ${freeDays} أو أكثر، و${aed(dubai.fee ?? 0)} لكل اتجاه للإيجارات الأقصر.`,
      },
    ],
    whatsappText: `مرحباً ${site.businessName}، لدي سؤال عن استلام سيارة في واحة دبي للسيليكون.`,
    howEyebrow: "الاستلام",
    howTitle: "كيف يتم الاستلام من المكتب",
    faqTitle: "أسئلة عن الاستلام",
    cta: { title: "استلم في الوقت الذي يناسبك", text: "اختر سيارة، وحدّد الاستلام من واحة دبي للسيليكون، واختر الوقت. نؤكد الموعد عبر واتساب." },
    location: {
      eyebrow: "الموقع",
      title: "كيف تصل إلى المكتب",
      address: () => [s.address.line1, s.address.area, `${s.address.city}، ${s.address.country}`],
      rows: () => [
        { label: "ساعات العمل", value: s.hours },
        { label: "الطرق", value: "طريق دبي–العين (E66)، و E311" },
        { label: "المواقف", value: "مواقف مجانية للزوار أمام المبنى" },
      ],
      directions: () => s.address.directions,
      openMaps: "افتح في خرائط Google",
    },
  },
];

export const getAreaPage = (slug: string) => areaPages.find((a) => a.slug === slug);
