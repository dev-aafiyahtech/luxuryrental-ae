import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { siteFor } from "@/content/localize";
import { countText, ltr } from "../shared";
import type { ContactPageContent } from "../contact";

// Arabic copy for /ar/contact: the same shape as ../contact.ts. Phone numbers sit in
// left-to-right isolates so their digit groups never reorder inside Arabic text.

const A = "ar";
const s = siteFor(A);
const { from, to } = rules.handoverHours;

export const contactPage: ContactPageContent = {
  meta: {
    title: "تواصل معنا: واتساب والهاتف والمكتب في دبي",
    description: () => `راسل ${site.businessName} عبر واتساب على الرقم ${ltr(site.whatsappDisplay, A)}. ${s.replyPromise} مكتبنا في واحة دبي للسيليكون.`,
  },
  crumb: "تواصل معنا",
  ldName: `تواصل مع ${site.businessName}`,
  eyebrow: "تواصل معنا",
  title: `تواصل مع ${site.businessName}`,
  lede: () => `واتساب هو أسرع طريقة للتواصل معنا. ${s.replyPromise}`,
  whatsapp: {
    prefill: `مرحباً ${site.businessName}، `,
    label: "واتساب، الأسرع",
    text: "أرسل لنا السيارة والتواريخ التي تفكر فيها، ونردّ عليك بالتوفر والسعر.",
    button: "راسلنا عبر واتساب",
  },
  channels: {
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    emailNote: "للمستندات والفواتير وأي رسالة طويلة",
    office: "المكتب",
    officeValue: () => `${s.address.line1}، ${s.address.area}`,
    officeNote: () => `${s.address.city}، ${s.address.country}. الزيارات بموعد مسبق.`,
    hours: "ساعات العمل",
    hoursNote: `تسليم السيارات من ${from} إلى ${to}`,
  },
  visit: {
    eyebrow: "زيارتنا",
    title: "مكتبنا في واحة دبي للسيليكون",
    address: () => [site.businessName, s.address.line1, `${s.address.area}، ${s.address.city}`, s.address.country],
    text: "يمكنك استلام السيارات وإعادتها هنا دون أي رسوم، بموعد مسبق. اطّلع على [الاستلام في واحة دبي للسيليكون](/delivery/dubai-silicon-oasis).",
    note: "سنضيف دبوس الخريطة والاتجاهات بعد تأكيد العنوان.",
  },
  complaints: {
    eyebrow: "الشكاوى",
    title: "إذا حدث خطأ ما",
    paras: () => [
      `أرسل لنا رقم طلبك وما حدث، عبر واتساب أو بالبريد الإلكتروني إلى [${site.email}](mailto:${site.email}). نردّ خلال ${countText(rules.complaintReplyWorkingDays, "day", A)} عمل.`,
      `إذا لم تكن راضياً عن ردّنا، يمكنك التواصل مع [${s.consumerProtection.name}](${site.consumerProtection.url}) على الرقم ${ltr(site.consumerProtection.phone, A)}. ولا يحدّ ذلك من حقوقك بموجب قانون حماية المستهلك في الإمارات.`,
    ],
  },
};
