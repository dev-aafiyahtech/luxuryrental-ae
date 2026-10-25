import type { CategorySlug, Season, Tier } from "../types";
import { getCar } from "../cars";
import { getZone } from "../zones";
import { rules } from "../rules";
import { formatNumber } from "@/lib/format";

// Arabic text for the data modules (cars, categories, zones, offers, seasons, tiers, rules, site).
// Brand and model names stay in Latin script, as on the cars themselves. Read through
// src/content/localize.ts; any entry left out falls back to English.
//
// Numbers are read from the data modules (never typed in), so a spec or fee change in
// cars.ts / zones.ts / rules.ts updates the Arabic text too. Demo translation, to be reviewed
// by a translator before launch (docs/dev/ARABIC-GUIDE.md).

// ---------------------------------------------------------------------------------------
// Arabic counted nouns. This module is a leaf (no imports from pages or localize), so the
// page helpers in content/pages/shared.ts re-use these without an import cycle.
// ---------------------------------------------------------------------------------------

const arPlural = new Intl.PluralRules("ar");

/** Arabic counted-noun forms by CLDR plural category. `{n}` is replaced by the number (Western digits). */
export interface ArabicCountForms {
  /** 1: "ساعة واحدة" */
  one: string;
  /** 2, after a preposition or as an object (the usual case in our copy): "ساعتين" */
  two: string;
  /** 2 as a subject or a standalone value: "ساعتان" (defaults to `two`) */
  twoNominative?: string;
  /** n % 100 in 3–10: "{n} ساعات" */
  few: string;
  /** n % 100 in 11–99: "{n} ساعة" */
  many: string;
  /** 0, 100–102, 1,000 and decimals: "{n} ساعة" */
  other: string;
}

/** A number with its noun in correct Arabic agreement ("3 أيام", "21 يوماً", "يومين"). */
export function arabicCount(n: number, forms: ArabicCountForms, nominative = false): string {
  const cat = arPlural.select(n);
  const form = cat === "one" ? forms.one : cat === "two" ? (nominative ? forms.twoNominative ?? forms.two : forms.two) : cat === "few" ? forms.few : cat === "many" ? forms.many : forms.other;
  return form.replace("{n}", formatNumber(n));
}

export type CountUnit = "day" | "hour" | "minute" | "month" | "year" | "week" | "passenger" | "seat" | "hp" | "ps" | "second" | "car" | "brand" | "question" | "answer" | "age";

export const arabicUnits: Record<CountUnit, ArabicCountForms> = {
  day: { one: "يوم واحد", two: "يومين", twoNominative: "يومان", few: "{n} أيام", many: "{n} يوماً", other: "{n} يوم" },
  hour: { one: "ساعة واحدة", two: "ساعتين", twoNominative: "ساعتان", few: "{n} ساعات", many: "{n} ساعة", other: "{n} ساعة" },
  minute: { one: "دقيقة واحدة", two: "دقيقتين", twoNominative: "دقيقتان", few: "{n} دقائق", many: "{n} دقيقة", other: "{n} دقيقة" },
  month: { one: "شهر واحد", two: "شهرين", twoNominative: "شهران", few: "{n} أشهر", many: "{n} شهراً", other: "{n} شهر" },
  year: { one: "سنة واحدة", two: "سنتين", twoNominative: "سنتان", few: "{n} سنوات", many: "{n} سنة", other: "{n} سنة" },
  week: { one: "أسبوع واحد", two: "أسبوعين", twoNominative: "أسبوعان", few: "{n} أسابيع", many: "{n} أسبوعاً", other: "{n} أسبوع" },
  passenger: { one: "راكب واحد", two: "راكبين", twoNominative: "راكبان", few: "{n} ركاب", many: "{n} راكباً", other: "{n} راكب" },
  seat: { one: "مقعد واحد", two: "مقعدين", twoNominative: "مقعدان", few: "{n} مقاعد", many: "{n} مقعداً", other: "{n} مقعد" },
  hp: { one: "حصان واحد", two: "حصانين", twoNominative: "حصانان", few: "{n} أحصنة", many: "{n} حصاناً", other: "{n} حصان" },
  ps: { one: "حصان متري واحد", two: "حصانين متريين", twoNominative: "حصانان متريان", few: "{n} أحصنة مترية", many: "{n} حصاناً مترياً", other: "{n} حصان متري" },
  second: { one: "ثانية واحدة", two: "ثانيتين", twoNominative: "ثانيتان", few: "{n} ثوانٍ", many: "{n} ثانية", other: "{n} ثانية" },
  car: { one: "سيارة واحدة", two: "سيارتين", twoNominative: "سيارتان", few: "{n} سيارات", many: "{n} سيارة", other: "{n} سيارة" },
  brand: { one: "علامة تجارية واحدة", two: "علامتين تجاريتين", twoNominative: "علامتان تجاريتان", few: "{n} علامات تجارية", many: "{n} علامة تجارية", other: "{n} علامة تجارية" },
  question: { one: "سؤال واحد", two: "سؤالين", twoNominative: "سؤالان", few: "{n} أسئلة", many: "{n} سؤالاً", other: "{n} سؤال" },
  answer: { one: "إجابة واحدة", two: "إجابتين", twoNominative: "إجابتان", few: "{n} إجابات", many: "{n} إجابة", other: "{n} إجابة" },
  /** Ages: "25 عاماً" */
  age: { one: "عام واحد", two: "عامين", twoNominative: "عامان", few: "{n} أعوام", many: "{n} عاماً", other: "{n} عام" },
};

const count = (n: number, unit: CountUnit) => arabicCount(n, arabicUnits[unit]);
const hp = (slug: string) => count(getCar(slug)?.specs.hp ?? 0, "hp");
const ps = (slug: string) => count(getCar(slug)?.specs.ps ?? 0, "ps");

// ---------------------------------------------------------------------------------------
// Cars
// ---------------------------------------------------------------------------------------

export interface CarTextAr {
  tagline: string;
  /** specs.body, e.g. "كوبيه، أبواب مقصية" */
  body: string;
  /** specs.engine, e.g. "محرك V12 سعة 6.5 لتر هجين قابل للشحن" */
  engine: string;
  interior: string;
  wheels: string;
  equipment: string[];
  /** Paint names usually stay as the maker writes them; set only to add an Arabic gloss. */
  paint?: string;
}

// Shared equipment and spec phrases, so the same item reads the same on every car.
const eq = {
  axleLift: "نظام رفع المحور الأمامي",
  ceramicBrakes: "مكابح من الكربون والسيراميك",
  passengerDisplay: "شاشة للراكب الأمامي",
  carplay: "Apple CarPlay",
  hardTop: "سقف صلب قابل للطي",
  rearWing: "جناح خلفي نشط",
  accuphase: "نظام صوت Accuphase",
  bw: "نظام صوت Bowers & Wilkins",
  naim: "نظام صوت Naim",
  sonus: "نظام صوت Sonus faber",
  starlight: "سقف Starlight Headliner المرصّع بالنجوم",
  rearScreens: "شاشات ترفيه للمقاعد الخلفية",
  panoramic: "سقف بانورامي",
  ventSport: "مقاعد رياضية مهوّاة",
};
const v8 = "محرك V8 سعة 4.0 لتر بشاحنَي توربو";
const v8Hybrid = "محرك V8 سعة 4.0 لتر بشاحنَي توربو، هجين قابل للشحن";
const v6Hybrid = "محرك V6 سعة 3.0 لتر بشاحنَي توربو، هجين قابل للشحن";
const v12Rr = "محرك V12 سعة 6.75 لتر بشاحنَي توربو";
const w16 = "محرك W16 سعة 8.0 لتر بأربعة شواحن توربو";
const nettuno = "محرك V6 سعة 3.0 لتر بشاحنَي توربو (Nettuno)";
const tenSpokeBlack = "عجلات مطروقة بعشرة أذرع، بلون أسود لامع";
const softTop = "مكشوفة بسقف قماشي";

export const carsAr: Partial<Record<string, CarTextAr>> = {
  "lamborghini-revuelto": {
    tagline: `الطراز الأعلى بمحرك V12، بأبواب مقصّية وقوة ${hp("lamborghini-revuelto")}.`,
    body: "كوبيه، أبواب مقصّية",
    engine: "محرك V12 سعة 6.5 لتر، هجين قابل للشحن",
    interior: "جلد أسود مع Alcantara، وخياطة برتقالية",
    wheels: "عجلات مطروقة مقاس 21 بوصة في الأمام و22 بوصة في الخلف، بلون أسود لامع",
    equipment: [eq.axleLift, eq.ceramicBrakes, eq.passengerDisplay, eq.carplay],
  },
  "rolls-royce-cullinan": {
    tagline: "شبكة أمامية مضيئة تخطف الأنظار ليلاً. قيادة ذاتية أو مع سائق خاص.",
    body: "سيارة SUV",
    engine: v12Rr,
    interior: "جلد Arctic White بحواف سوداء",
    wheels: "عجلات مطروقة مقاس 23 بوصة، مصقولة",
    equipment: [eq.starlight, "لوحة قيادة مضيئة", eq.rearScreens, "نظام صوت Bespoke"],
  },
  "bugatti-chiron-super-sport": {
    tagline: `آخر إصدارات Chiron. قوة ${hp("bugatti-chiron-super-sport")} من محرك W16 بأربعة شواحن توربو.`,
    body: "كوبيه بذيل ممتد",
    engine: w16,
    interior: "جلد Beluga أسود مع خياطة زرقاء",
    wheels: "عجلات مطروقة مقاس 20 بوصة في الأمام و21 بوصة في الخلف، بلمسة نهائية داكنة",
    equipment: [eq.rearWing, eq.ceramicBrakes, eq.axleLift, eq.accuphase],
  },
  "ferrari-296-gts": {
    tagline: "سبايدر هجينة بمحرك V6، يُطوى سقفها في 14 ثانية.",
    body: "سبايدر بسقف صلب قابل للطي",
    engine: v6Hybrid,
    interior: "جلد Nero مع خياطة صفراء",
    wheels: "عجلات مطروقة مقاس 20 بوصة، بلمسة ماسية",
    equipment: [eq.hardTop, "وضع القيادة الكهربائية eDrive", eq.axleLift, eq.passengerDisplay],
  },
  "mclaren-750s-spider": {
    tagline: "أبواب ثنائية الزاوية، وهيكل من ألياف الكربون، وسماء مفتوحة.",
    body: "سقف صلب قابل للطي، أبواب ثنائية الزاوية",
    engine: v8,
    interior: "جلد Carbon Black مع Alcantara",
    wheels: tenSpokeBlack,
    equipment: [eq.hardTop, "سقف زجاجي كهروكرومي يتحكّم بالتعتيم", eq.axleLift, eq.bw],
  },
  "ferrari-purosangue": {
    tagline: "أول Ferrari بأربعة أبواب، بمحرك V12 بتنفّس طبيعي.",
    body: "سيارة SUV بأربعة أبواب",
    engine: "محرك V12 سعة 6.5 لتر",
    interior: "جلد Cuoio بلون بني فاتح",
    wheels: "عجلات مطروقة مقاس 22 بوصة في الأمام و23 بوصة في الخلف",
    equipment: ["أربعة مقاعد منفصلة بخاصية التدليك", "أبواب خلفية تنفتح من الخلف", "نظام صوت Burmester", eq.passengerDisplay],
  },
  "lamborghini-urus-se": {
    tagline: "سيارة SUV الخارقة المفضّلة في دبي، أصبحت الآن هجينة قابلة للشحن.",
    body: "سيارة SUV",
    engine: v8Hybrid,
    interior: "جلد Nero Ade مع خياطة حمراء",
    wheels: "عجلات مطروقة مقاس 23 بوصة، بلون أسود لامع",
    equipment: ["نظام هجين قابل للشحن مع وضع كهربائي", eq.panoramic, "نظام صوت Bang & Olufsen ثلاثي الأبعاد", "مقاعد مهوّاة بخاصية التدليك"],
  },
  "mclaren-artura": {
    tagline: `سيارة خارقة هجينة بقوة ${ps("mclaren-artura")}، رشيقة وخفيفة الحركة.`,
    body: "كوبيه، أبواب ثنائية الزاوية",
    engine: v6Hybrid,
    interior: "Alcantara بلون Carbon Black",
    wheels: tenSpokeBlack,
    equipment: ["وضع القيادة الكهربائية E-mode", eq.axleLift, eq.bw, eq.carplay],
  },
  "aston-martin-dbx707": {
    tagline: `سيارة SUV بريطانية عالية الأداء بقوة ${ps("aston-martin-dbx707")}.`,
    body: "سيارة SUV",
    engine: v8,
    interior: "جلد أسود مع خياطة حمراء",
    wheels: "عجلات مطروقة مقاس 23 بوصة، بلون أسود ساتان",
    equipment: ["سقف زجاجي بانورامي", eq.bw, "كاميرا بزاوية 360°", eq.ventSport],
  },
  "aston-martin-db12-volante": {
    tagline: "سيارة GT مكشوفة لرحلات طريق حتا.",
    body: softTop,
    engine: v8,
    interior: "جلد عاجي مع خشب الجوز الداكن",
    wheels: "عجلات مطروقة مقاس 21 بوصة، بلون أسود ساتان",
    equipment: ["سقف قماشي من ثماني طبقات", eq.bw, eq.ventSport, eq.carplay],
  },
  "bentley-bentayga-ewb": {
    tagline: "هدوء قاعدة العجلات الطويلة، ومقاعد خلفية بروح صالة الاسترخاء.",
    body: "سيارة SUV بقاعدة عجلات طويلة",
    engine: v8,
    interior: "جلد بلونَي Linen وBeluga، مع خشب جوز بلمسة طبيعية مفتوحة المسام",
    wheels: "عجلات مقاس 22 بوصة بعشرة أذرع، مطلية",
    equipment: ["مقاعد خلفية على طراز الدرجة الأولى مع ضبط وضعية الجلوس", eq.naim, eq.panoramic, eq.rearScreens],
  },
  "bentley-continental-gtc-speed": {
    tagline: `أربعة مقاعد، وسقف قماشي، ومحرك V8 هجين بقوة ${ps("bentley-continental-gtc-speed")}.`,
    body: softTop,
    engine: v8Hybrid,
    interior: "جلد Beluga مع لون Cricket Ball الأحمر",
    wheels: "عجلات مطروقة مقاس 22 بوصة، بالأسود والمصقول",
    equipment: ["سقف قماشي من ثلاث طبقات يُفتح أثناء القيادة", "مدفئات للرقبة", "شاشة دوّارة", eq.naim],
  },
  "rolls-royce-phantom": {
    tagline: "الليموزين مع سائق خاص لحفلات الزفاف واستقبال كبار الضيوف.",
    body: "سيدان بقاعدة عجلات طويلة",
    engine: v12Rr,
    interior: "جلد Seashell بحواف كحلية",
    wheels: "عجلات مصقولة مقاس 22 بوصة، بشعارات وسطية تبقى مستقيمة",
    equipment: [eq.starlight, "طاولات وشاشات للمقاعد الخلفية", "أبواب خلفية تنفتح من الخلف", "مبرّد مشروبات خلفي"],
  },
  "maserati-mcpura-cielo": {
    tagline: "أبواب فراشة، وسقف زجاجي يصبح شفافاً بلمسة.",
    body: "سقف زجاجي قابل للطي، أبواب فراشة",
    engine: nettuno,
    interior: "جلد Ghiaccio أبيض مع خياطة زرقاء",
    wheels: "عجلات مطروقة مقاس 20 بوصة، بلون أسود لامع",
    equipment: ["سقف زجاجي يصبح معتماً بلمسة", "سقف قابل للطي", eq.sonus, eq.axleLift],
  },
  "maserati-granturismo-trofeo": {
    tagline: "سيارة GT بأربعة مقاعد، وأسهل طريق إلى أسطولنا.",
    body: "كوبيه",
    engine: nettuno,
    interior: "جلد أسود مع خياطة حمراء",
    wheels: "عجلات مطروقة مقاس 20 بوصة، بلمسة نهائية داكنة",
    equipment: ["أربعة مقاعد بالحجم الكامل", eq.sonus, "شاشة عرض على الزجاج الأمامي", "نظام تعليق هوائي"],
  },
  "bugatti-chiron-sport": {
    tagline: `قوة ${hp("bugatti-chiron-sport")}، وتسليم بمرافقة فريقنا مع شرح وافٍ للسيارة.`,
    body: "كوبيه",
    engine: w16,
    interior: "جلد بالأحمر الإيطالي والأسود",
    wheels: "عجلات مطروقة مقاس 20 بوصة في الأمام و21 بوصة في الخلف، باللون الأسود",
    equipment: [eq.rearWing, eq.ceramicBrakes, eq.accuphase, eq.axleLift],
  },
};

// ---------------------------------------------------------------------------------------
// Categories and brands
// ---------------------------------------------------------------------------------------

export const categoriesAr: Partial<Record<CategorySlug, { name: string; singular: string; description: string }>> = {
  supercars: { name: "السيارات الخارقة", singular: "سيارة خارقة", description: "سيارات بمقعدين ومحرك وسطي أو خلفي، صُنعت لطريق الساحل وجبل جيس." },
  suvs: { name: "سيارات SUV الفاخرة", singular: "سيارة SUV فاخرة", description: "سيارات مرتفعة بأربعة أو خمسة مقاعد، للعائلات ورحلات المطار والرحلات اليومية إلى حتا." },
  convertibles: { name: "السيارات المكشوفة", singular: "سيارة مكشوفة", description: "سيارات بسقف مفتوح لأمسيات الشتاء على شارع جميرا." },
  "grand-tourers": { name: "سيارات GT", singular: "سيارة GT", description: "سيارات بمحرك أمامي للمسافات الطويلة، تتسع لشخصين أو أربعة." },
  hypercars: { name: "سيارات الهايبركار", singular: "سيارة هايبركار", description: `قوة ${count(1500, "hp")} فأكثر. السعر عند الطلب، مع تسليم بمرافقة فريقنا.` },
};

export const brandCountriesAr: Partial<Record<string, string>> = {
  lamborghini: "إيطاليا",
  ferrari: "إيطاليا",
  maserati: "إيطاليا",
  "rolls-royce": "المملكة المتحدة",
  mclaren: "المملكة المتحدة",
  bentley: "المملكة المتحدة",
  "aston-martin": "المملكة المتحدة",
  bugatti: "فرنسا",
};

// ---------------------------------------------------------------------------------------
// Delivery zones
// ---------------------------------------------------------------------------------------

const dubaiFreeDays = getZone("dubai")?.freeFromDays ?? 2;
const airportNote = "يشمل الاستقبال في صالة الوصول ومواقف المطار. نتابع رحلتك الجوية.";

export const zonesAr: Partial<Record<string, { name: string; areas: string[]; note?: string }>> = {
  dso: { name: "واحة دبي للسيليكون (مكتبنا)", areas: ["واحة دبي للسيليكون"], note: "استلم السيارة وأعدها في مكتبنا دون أي رسوم." },
  dubai: {
    name: "أي مكان في دبي",
    areas: ["وسط مدينة دبي", "دبي مارينا", "مساكن شاطئ جميرا (JBR)", "نخلة جميرا", "الخليج التجاري", "مركز دبي المالي العالمي (DIFC)", "جميرا", "البرشاء", "دبي هيلز", "المرابع العربية", "ديرة", "بر دبي"],
    note: `مجاناً للإيجارات لمدة ${count(dubaiFreeDays, "day")} أو أكثر. حتا منطقة منفصلة.`,
  },
  dxb: { name: "مطار دبي الدولي (DXB)", areas: ["المبنى 1", "المبنى 2", "المبنى 3"], note: airportNote },
  dwc: { name: "مطار آل مكتوم الدولي (DWC)", areas: ["مبنى المسافرين"], note: airportNote },
  hatta: { name: "حتا", areas: ["حتا"] },
  "sharjah-ajman": { name: "الشارقة وعجمان", areas: ["الشارقة", "عجمان"] },
  "abu-dhabi": { name: "مدينة أبوظبي وجزيرتا ياس والسعديات", areas: ["مدينة أبوظبي", "جزيرة ياس", "جزيرة السعديات"] },
  "other-emirates": { name: "العين ورأس الخيمة وأم القيوين والفجيرة", areas: ["العين", "رأس الخيمة", "أم القيوين", "الفجيرة"], note: "يُطلب قبل 24 ساعة على الأقل." },
};

// ---------------------------------------------------------------------------------------
// Offers, seasons, tiers, rules
// ---------------------------------------------------------------------------------------

export const offersAr: Partial<Record<string, { name: string; summary: string }>> = {
  "founding-client": { name: "عرض العملاء المؤسسين", summary: "توصيل السيارة واستلامها منك مجاناً في أي مكان في دبي، مع 50 كم إضافية في اليوم." },
  "first-long-rental": { name: "عرض أول إيجار طويل", summary: "خصم 10% على أول طلب لمدة 3 أيام أو أكثر (لا يشمل السيارات الرائدة وسيارات Bugatti وفترة ذروة الأعياد)." },
  "chauffeur-intro": { name: "عرض السائق الخاص الافتتاحي", summary: "ساعة مجانية عند أول طلب مع سائق خاص لمدة 5 أو 10 ساعات." },
};

export const seasonsAr: Partial<Record<Season["id"], string>> = {
  summer: "موسم الصيف",
  standard: "الموسم العادي",
  peak: "موسم الذروة",
  "super-peak": "ذروة الأعياد",
};

export const tiersAr: Partial<Record<Tier, string>> = {
  L: "الفئة الفاخرة",
  S: "فئة السيارات الخارقة",
  H: "فئة الهايبركار",
};

export const rulesAr: { chauffeurIncluded?: string; cancellationSummary?: string } = {
  chauffeurIncluded: `السائق الخاص والوقود ورسوم سالك ودرب ومياه الشرب وشبكة Wi-Fi. انتظار مجاني لمدة ${count(rules.airportWaitFreeMinutes, "minute")} في المطارات.`,
  cancellationSummary: "يمكنك إلغاء الطلب مجاناً قبل أن نؤكده. بعد التأكيد، نردّ أي دفعة مقدّمة بالكامل حتى 72 ساعة قبل بدء الإيجار (7 أيام لسيارات الهايبركار، و24 ساعة لطلبات السائق الخاص).",
};

export const siteAr: {
  hours?: string;
  replyPromise?: string;
  address?: { line1?: string; area?: string; city?: string; country?: string; directions?: string };
  consumerProtectionName?: string;
  licenceAuthority?: string;
} = {
  hours: "يومياً من 09:00 إلى 22:00",
  replyPromise: "نردّ عبر واتساب، عادةً خلال ساعة واحدة، من 09:00 إلى 22:00.",
  address: {
    line1: "المكتب 1208، مبنى مقر واحة دبي للسيليكون",
    area: "واحة دبي للسيليكون",
    city: "دبي",
    country: "الإمارات العربية المتحدة",
    directions: "يقع مبنى مقر واحة دبي للسيليكون بجوار طريق دبي–العين (E66). تتوفر مواقف للزوار أمام المبنى، ونُحضر السيارة إلى المدخل الرئيسي للتسليم.",
  },
  consumerProtectionName: "إدارة حماية المستهلك في دائرة الاقتصاد والسياحة بدبي",
  licenceAuthority: "دائرة الاقتصاد والسياحة في دبي (DET)",
};
