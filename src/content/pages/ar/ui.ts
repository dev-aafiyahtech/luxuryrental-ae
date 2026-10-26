import type { ContentUi } from "../ui";
import { arabicCount, arabicUnits } from "@/content/ar/data";

// Arabic labels for the content pages and src/components/content: the same shape as ../ui.ts.
// Only a type comes from ../ui.ts, so there is no runtime import cycle.

const hours = (n: number) => arabicCount(n, arabicUnits.hour);
const days = (n: number) => arabicCount(n, arabicUnits.day);

export const contentUi: ContentUi = {
  home: "الرئيسية",
  browseFleet: "تصفّح الأسطول",
  askWhatsApp: "اسألنا عبر واتساب",
  messageWhatsApp: "راسلنا عبر واتساب",
  questions: "أسئلة",

  offer: {
    badge: "عرض الإطلاق",
    label: (name: string) => name,
    until: (date: string) => `حتى ${date}`,
  },
  lastUpdated: "آخر تحديث",

  chauffeurCard: {
    chauffeurFirst: "مع سائق أولاً",
    perHour: "للساعة",
    fullDay: "يوم كامل",
    minimum: (h: number) => `حد أدنى ${hours(h)}. الأسعار شاملة ضريبة القيمة المضافة.`,
    request: "اطلب سائقاً خاصاً",
    details: "تفاصيل السيارة",
  },

  map: {
    title: "خريطة توضيحية لمناطق التوصيل",
    desc: "مقرنا في واحة دبي للسيليكون. نوصل إلى أنحاء دبي، بما فيها دبي مارينا ونخلة جميرا ووسط المدينة، وإلى مطارَي DXB و DWC، وإلى الشارقة وعجمان وحتا وأبوظبي. الخريطة ليست بمقياس رسم.",
    sea: "الخليج العربي",
    dubaiZone: "منطقة دبي",
    dubaiFree: (d: number) => `دبي · مجاناً من ${days(d)}`,
    marina: "دبي مارينا، JBR",
    palm: "نخلة جميرا",
    downtown: "وسط المدينة، DIFC",
    dxb: "مطار DXB",
    // Isolated so the fee that follows stays next to "درهم" (bidi rule W7).
    terminals: "\u2066T1، T2، T3\u2069",
    dwc: "مطار DWC",
    sharjah: "الشارقة، عجمان",
    hatta: "حتا",
    abuDhabi: "أبوظبي",
    eachWay: (fee: string) => `${fee} لكل اتجاه`,
    base: "مقرنا",
    baseSub: (fee: string) => `واحة دبي للسيليكون · ${fee}`,
    north: "ش",
    free: "مجاناً",
    onRequest: "عند الطلب",
    caption: "خريطة توضيحية ليست بمقياس رسم. الرسوم لكل عملية تسليم، لكل اتجاه، وتشمل ضريبة القيمة المضافة.",
  },

  contactForm: {
    title: "أرسل لنا رسالة",
    intro: "نردّ عبر واتساب أو الهاتف. جميع الحقول مطلوبة.",
    name: "الاسم",
    mobile: "رقم الجوال أو واتساب",
    mobileHint: "مع رمز الدولة.",
    message: "الرسالة",
    messageHint: "ذكر السيارة والتواريخ يساعدنا على الرد بسرعة أكبر. يُرجى عدم كتابة بيانات البطاقة.",
    errName: "أدخل اسمك.",
    errMobile: "أدخل رقم جوالك.",
    errMobileFormat: "أدخل رقم الجوال مع رمز الدولة، مثل ⁦+971 50 123 4567⁩.",
    errMessage: "أخبرنا بالمزيد، 10 أحرف على الأقل.",
    send: "أرسل عبر واتساب",
    note: "يفتح واتساب ورسالتك جاهزة للإرسال.",
    waHeading: "استفسار من LuxuryRentals.ae",
    sentTitle: "رسالتك جاهزة في واتساب",
    sentText: "اضغط إرسال في واتساب لتصل رسالتك إلى فريقنا. نردّ عبر واتساب، عادةً خلال ساعة واحدة، من 09:00 إلى 22:00.",
    again: "إرسال رسالة أخرى",
  },
};
