// Site-wide settings (the future Sanity `siteSettings` document). Values in [brackets]
// are placeholders until the client sends them (plan §9, questions 10–11).

export const site = {
  brandName: "LuxuryRental.ae", // wordmark, approved 23 Oct 2026
  businessName: "Luxuryrentals", // trade name: legal text, footer, Google Business
  legalName: "[Legal entity name]",
  domain: "luxuryrental.ae",
  url: "https://www.luxuryrental.ae",
  whatsapp: "971529652722", // wa.me format
  whatsappDisplay: "+971 52 965 2722",
  phone: "+971 52 965 2722",
  email: "bookings@luxuryrental.ae",
  address: { line1: "[Office], [Building]", area: "Dubai Silicon Oasis", city: "Dubai", country: "United Arab Emirates" },
  hours: "Daily 09:00–22:00",
  replyPromise: "We reply on WhatsApp, usually within 1 hour, 09:00–22:00.",
  tradeLicence: "[Trade licence no.]",
  licenceAuthority: "[DSO/DIEZ or DET]",
  rtaPermit: "[RTA permit no.]",
  vatTrn: "[100XXXXXXXXXXXX]",
  vatRate: 5,
  socials: [] as { name: string; url: string }[], // hidden until real handles exist
  /** Demo mode: nothing is booked or charged; the banner and mock payments are on. */
  demo: true,
} as const;

export type Site = typeof site;
