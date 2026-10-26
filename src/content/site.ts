// Site-wide settings (the future Sanity `siteSettings` document). The company details
// (legal name, office, licence, permit, TRN) are assumed sample values for the demo until
// the client sends the real ones (plan §9, question 11; docs/brief/assumptions.md).
// While `sampleDetails` is true, the footer and About page say they are samples.

/**
 * Canonical address for links, the sitemap and share images. Until luxuryrentals.ae is on the
 * Vercel project, this is the project's live address (e.g. luxuryrental-ae.vercel.app), so link
 * previews work; once the domain is connected, it is the www host. Locally: the www host.
 */
function siteUrl() {
  const host = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return !host || host.endsWith("luxuryrentals.ae") ? "https://www.luxuryrentals.ae" : `https://${host}`;
}

export const site = {
  brandName: "LuxuryRentals.ae", // wordmark and domain (corrected from "LuxuryRental.ae" by Zubair, 26 Oct 2026)
  businessName: "Luxuryrentals", // trade name: legal text, footer, Google Business
  legalName: "Luxuryrentals Car Rental L.L.C.", // assumed
  domain: "luxuryrentals.ae",
  url: siteUrl(),
  whatsapp: "971529652722", // wa.me format
  whatsappDisplay: "+971 52 965 2722",
  phone: "+971 52 965 2722",
  email: "bookings@luxuryrentals.ae",
  privacyEmail: "privacy@luxuryrentals.ae",
  opsEmail: "ops@luxuryrentals.ae", // ops alerts and request emails (assumed)
  address: {
    line1: "Office 1208, Silicon Oasis HQ", // assumed
    area: "Dubai Silicon Oasis",
    city: "Dubai",
    country: "United Arab Emirates",
    directions: "Silicon Oasis HQ is beside the Dubai–Al Ain Road (E66). Visitor parking is in front of the building; we bring the car to the main entrance for handover.",
    mapUrl: "https://maps.google.com/?q=Dubai+Silicon+Oasis+Headquarters",
  },
  hours: "Daily 09:00–22:00",
  replyPromise: "We reply on WhatsApp, usually within 1 hour, 09:00–22:00.",
  tradeLicence: "1234567", // sample
  licenceAuthority: "Dubai Department of Economy and Tourism (DET)", // assumed
  rtaPermit: "123456", // sample
  vatTrn: "100123456700003", // sample
  vatRate: 5,
  socials: [] as { name: string; url: string }[], // hidden until real handles exist
  /** Company details above are samples; the footer and About page say so. */
  sampleDetails: true,
  /** Dubai consumer protection, named in the complaints process. */
  consumerProtection: { name: "Dubai Economy and Tourism Consumer Protection", url: "https://consumerrights.ae", phone: "600 545 555" },
  /** Demo mode: nothing is booked or charged; the banner and mock payments are on. */
  demo: true,
} as const;

export type Site = typeof site;
