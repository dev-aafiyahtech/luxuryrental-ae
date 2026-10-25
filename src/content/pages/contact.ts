import { rules } from "@/content/rules";
import { site } from "@/content/site";

// Copy for /contact (workstream 06 §6.2). Contact details come from site.ts; the Arabic
// version is ./ar/contact.ts, same shape. Paragraphs use the copy mini-markup.

const { from, to } = rules.handoverHours;

export const contactPage = {
  meta: {
    title: "Contact Us: WhatsApp, Phone and Office in Dubai",
    description: () => `Message ${site.businessName} on WhatsApp at ${site.whatsappDisplay}. ${site.replyPromise} Office in Dubai Silicon Oasis.`,
  },
  crumb: "Contact",
  ldName: `Contact ${site.businessName}`,
  eyebrow: "Contact",
  title: `Contact ${site.businessName}`,
  lede: () => `WhatsApp is the fastest way to reach us. ${site.replyPromise}`,
  whatsapp: {
    prefill: `Hello ${site.businessName}, `,
    label: "WhatsApp, fastest",
    text: "Send the car and the dates you have in mind. We reply with availability and the price.",
    button: "Message us on WhatsApp",
  },
  channels: {
    phone: "Phone",
    email: "Email",
    emailNote: "For documents, invoices and anything long",
    office: "Office",
    officeValue: () => `${site.address.line1}, ${site.address.area}`,
    officeNote: () => `${site.address.city}, ${site.address.country}. Visits by appointment.`,
    hours: "Hours",
    hoursNote: `Car handovers ${from}–${to}`,
  },
  visit: {
    eyebrow: "Visit",
    title: "Our office in Dubai Silicon Oasis",
    address: () => [site.businessName, site.address.line1, `${site.address.area}, ${site.address.city}`, site.address.country],
    text: "You can collect and return cars here at no charge, by appointment. See [collection in Dubai Silicon Oasis](/delivery/dubai-silicon-oasis).",
    note: "Map pin and directions follow once the address is confirmed.",
  },
  complaints: {
    eyebrow: "Complaints",
    title: "If something went wrong",
    paras: () => [
      `Send us your booking reference and what happened, on WhatsApp or by email to [${site.email}](mailto:${site.email}). We reply within ${rules.complaintReplyWorkingDays} working days.`,
      `If you are not satisfied with our answer, you can contact [${site.consumerProtection.name}](${site.consumerProtection.url}) on ${site.consumerProtection.phone}. This does not limit your rights under UAE consumer protection law.`,
    ],
  },
};

/** The shape the Arabic module (./ar/contact.ts) follows. */
export type ContactPageContent = typeof contactPage;
