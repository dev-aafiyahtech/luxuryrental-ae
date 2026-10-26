import { cars, chauffeurCars } from "@/content/cars";
import { brands } from "@/content/brands";
import { getZone } from "@/content/zones";
import { site } from "@/content/site";
import { siteFor } from "@/content/localize";
import { formatAED } from "@/lib/format";
import { countText, listJoin, ltr } from "../shared";
import type { AboutPageContent } from "../about";

// Arabic About copy: the same shape as ../about.ts. No invented founding year, awards,
// customer counts or team photos, and the honest "no reviews yet" line stays. Fleet facts
// are read from the data. Demo translation, to be reviewed before launch.

const A = "ar";
const s = siteFor(A);
const cheapest = [...cars].sort((a, b) => a.rates.daily - b.rates.daily)[0];
const halo = [...cars].sort((a, b) => b.specs.hp - a.specs.hp)[0];
const dubai = getZone("dubai")!;
const freeDays = countText(dubai.freeFromDays ?? 0, "day", A);
const chauffeur = chauffeurCars().map((c) => c.name.replace(/ Series II.*$| EWB.*$/, ""));
const fleet = countText(cars.length, "car", A);
const brandCount = countText(brands.length, "brand", A);

export const aboutPage: AboutPageContent = {
  meta: {
    title: "من نحن: تأجير السيارات الفاخرة من واحة دبي للسيليكون",
    description: `تؤجّر ${site.businessName} ${fleet} من ${brandCount} انطلاقاً من واحة دبي للسيليكون. الأسعار شاملة ضريبة القيمة المضافة، ويؤكد أحد أعضاء فريقنا كل طلب عبر واتساب.`,
  },
  hero: {
    eyebrow: "من نحن",
    title: `عن ${site.businessName}`,
    lede: `نؤجّر ${fleet} من ${brandCount} انطلاقاً من واحة دبي للسيليكون، ويؤكد أحد أعضاء فريقنا كل طلب عبر واتساب.`,
  },
  storyTitle: `${countText(cars.length, "car", A, true)}، نعرف كل واحدة منها بالتفصيل`,
  cta: `تصفّح سياراتنا كلها، وعددها ${countText(cars.length, "car", A, true)}، مع أسعارها اليومية ومبالغ التأمين والكيلومترات المشمولة، ثم أرسل طلباً لتواريخك.`,
  story: [
    `تتخذ ${site.businessName} من واحة دبي للسيليكون مقراً لها، وهي شركة لتأجير السيارات تحتفظ بأسطول صغير عن قصد: ${fleet} من ${brandCount}، من ${cheapest.name} إلى ${halo.name}. نفضّل أن نعرف كل سيارة بالتفصيل على أن نعرض المئات مما لم نقده يوماً.`,
    `لا ينبغي أن يأتي استئجار سيارة فاخرة مع مفاجآت: سعر يرتفع حين تُضاف الضريبة، أو مبلغ تأمين لم يذكره أحد، أو سيارة مختلفة في يوم الاستلام. وقد أسّسنا ${site.businessName} لتعمل بالطريقة المعاكسة.`,
    `كل سعر على هذا الموقع يشمل ضريبة القيمة المضافة، ومبلغ التأمين معروض بجانبه قبل أن تطلب أي شيء. أنت ترسل طلباً، ويراجع أحد أعضاء فريقنا السيارة وتواريخك ورخصتك، ثم يؤكد عبر واتساب. لا يصبح أي حجز مؤكداً قبل أن نؤكده نحن، ولا يُحصَّل أي مبلغ على هذا الموقع.`,
    `نحتفظ بالسيارات في مكتبنا في واحة دبي للسيليكون، بجوار طريق دبي–العين. ومن هناك نوصلها إلى أنحاء دبي، ونستقبل الرحلات الجوية في DXB و DWC، ونصل إلى الشارقة وأبوظبي وحتا. والتوصيل مجاني إلى أي مكان في دبي للإيجارات لمدة ${freeDays} أو أكثر.`,
    `بعض الرحلات أجمل مع سائق. تتوفر ${listJoin(chauffeur, "and", A)} مع سائق خاص بالساعة، لحفلات الزفاف وأيام العمل والوصول إلى المطار.`,
    `نحن اسم جديد، لذا لا توجد تقييمات نعرضها عليك بعد. ما يمكننا أن نعرضه هو كل سعر ورسم وقاعدة، مكتوبة في مكان واحد، لتعرف السعر قبل أن تراسلنا.`,
  ],
  pillars: [
    { title: "السعر يشمل الضريبة", text: () => `تشمل الأسعار اليومية والأسبوعية والشهرية ضريبة القيمة المضافة بنسبة ${site.vatRate}%. وتجد مبلغ التأمين والتوصيل وكل الرسوم في صفحة الأسعار، فترى السعر الكامل قبل أن ترسل طلبك.` },
    { title: "شخص حقيقي يؤكد كل طلب", text: () => `تصل الطلبات إلى فريقنا، فيراجع السيارة وبياناتك قبل التأكيد. ${s.replyPromise}` },
    { title: "نوصلها إليك أينما كنت", text: () => `توصيل مجاني إلى أي مكان في دبي للإيجارات لمدة ${freeDays} أو أكثر، واستقبال في مطارَي DXB و DWC مقابل ${formatAED(getZone("dxb")!.fee ?? 0, A)}.` },
  ],
  company: () => [
    { label: "الاسم التجاري", value: site.businessName },
    { label: "الكيان القانوني", value: ltr(site.legalName, A) },
    { label: "الرخصة التجارية", value: `${site.tradeLicence}، صادرة عن دائرة الاقتصاد والسياحة في دبي (DET)` },
    { label: "تصريح التأجير من هيئة الطرق والمواصلات", value: site.rtaPermit },
    { label: "الرقم الضريبي (TRN)", value: site.vatTrn },
    { label: "العنوان", value: `${s.address.line1}، ${s.address.area}، ${s.address.city}` },
    { label: "ساعات العمل", value: s.hours },
  ],
  ui: {
    crumb: "من نحن",
    messageUs: "راسلنا",
    whatsappText: `مرحباً ${site.businessName}.`,
    storyEyebrow: "قصتنا",
    fleetByBrand: "الأسطول حسب العلامة التجارية",
    howEyebrow: "طريقة عملنا",
    howTitle: "ثلاثة التزامات نحرص عليها",
    trust: [`الأسعار شاملة ضريبة القيمة المضافة بنسبة ${site.vatRate}%`, "مقرنا في واحة دبي للسيليكون", "تأمين شامل في كل إيجار", "تأكيد الطلبات عبر واتساب"],
    companyEyebrow: "بيانات الشركة",
    companyTitle: "ممّن تستأجر",
    ctaTitle: "اعثر على سيارتك",
    contactUs: "تواصل معنا",
  },
};
