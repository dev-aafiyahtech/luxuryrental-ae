import { contentUi as contentUiAr } from "./ar/ui";

// Labels shared by the content pages and src/components/content (offer notice, map, chauffeur
// card, contact form). Plain data with no server-only imports, so the client contact form can
// use it too. Arabic in ./ar/ui.ts, same shape.

export const contentUi = {
  home: "Home",
  browseFleet: "Browse the fleet",
  askWhatsApp: "Ask on WhatsApp",
  messageWhatsApp: "Message us on WhatsApp",
  questions: "Questions",

  offer: {
    badge: "Launch offer",
    label: (name: string) => `${name} offer`,
    until: (date: string) => `Until ${date}`,
  },
  lastUpdated: "Last updated",

  chauffeurCard: {
    chauffeurFirst: "Chauffeur first",
    perHour: "Per hour",
    fullDay: "Full day",
    minimum: (hours: number) => `${hours}-hour minimum. Prices include VAT.`,
    request: "Request a chauffeur",
    details: "Car details",
  },

  map: {
    title: "Schematic map of our delivery zones",
    desc: "Our base is in Dubai Silicon Oasis. We deliver across Dubai, including Dubai Marina, Palm Jumeirah and Downtown, to DXB and DWC airports, and to Sharjah, Ajman, Hatta and Abu Dhabi. Not to scale.",
    sea: "Arabian Gulf",
    dubaiZone: "Dubai zone",
    dubaiFree: (days: number) => `Dubai · free from ${days} days`,
    marina: "Dubai Marina, JBR",
    palm: "Palm Jumeirah",
    downtown: "Downtown, DIFC",
    dxb: "DXB airport",
    terminals: "T1, T2, T3",
    dwc: "DWC airport",
    sharjah: "Sharjah, Ajman",
    hatta: "Hatta",
    abuDhabi: "Abu Dhabi",
    eachWay: (fee: string) => `${fee} each way`,
    base: "Our base",
    baseSub: (fee: string) => `Dubai Silicon Oasis · ${fee}`,
    north: "N",
    free: "Free",
    onRequest: "On request",
    caption: "Schematic map, not to scale. Fees are per handover, each way, and include VAT.",
  },

  contactForm: {
    title: "Send us a message",
    intro: "We reply on WhatsApp or by phone. All fields are required.",
    name: "Name",
    mobile: "Mobile or WhatsApp",
    mobileHint: "With the country code.",
    message: "Message",
    messageHint: "The car and dates help us answer faster. Please don't include card details.",
    errName: "Enter your name.",
    errMobile: "Enter your mobile number.",
    errMobileFormat: "Enter a mobile number with its country code, for example +971 50 123 4567.",
    errMessage: "Tell us a little more, at least 10 characters.",
    send: "Send on WhatsApp",
    note: "Opens WhatsApp with your message, ready to send.",
    waHeading: "Enquiry from LuxuryRentals.ae",
    sentTitle: "Your message is ready in WhatsApp",
    sentText: "Press send in WhatsApp to reach our team. We reply on WhatsApp, usually within 1 hour, 09:00–22:00.",
    again: "Send another message",
  },
};

export type ContentUi = typeof contentUi;

/** Content labels in the visitor's language. */
export const contentUiFor = (locale?: string): ContentUi => (locale === "ar" ? contentUiAr : contentUi);
