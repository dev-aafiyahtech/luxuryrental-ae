// Site-wide settings (the future Sanity `siteSettings` document). The company details
// (legal name, office, licence, permit, TRN) are assumed sample values for the demo until
// the client sends the real ones (plan §9, question 11; docs/brief/assumptions.md).

/**
 * Canonical address for links, the sitemap and share images. Until luxuryrentals.ae is on the
 * Vercel project, this is the project's live address (e.g. luxuryrental-ae.vercel.app), so link
 * previews work; once the domain is connected, it is the www host. Locally: the www host.
 */
function siteUrl() {
  const host = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return !host || host.endsWith("luxuryrentals.ae") ? "https://www.luxuryrentals.ae" : `https://${host}`;
}

/** A public review profile: the rating out of 5 and review count as the platform shows them. */
export type ReviewProfile = { rating: number; count: number; url: string };
export type ReviewPlatform = "google" | "trustpilot";
/** Payment methods with a footer mark (src/content/footer-marks.ts). */
export type PaymentMethodId = "visa" | "mastercard" | "amex" | "applepay" | "googlepay";

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
  /**
   * Public review profiles shown as footer badges. Each stays null until the business has a
   * verified profile: a badge renders only when its entry is filled, and the rating and count
   * must be copied from the live profile (never estimated), then kept current.
   */
  reviews: {
    google: null as null | ReviewProfile,
    trustpilot: null as null | ReviewProfile,
  },
  /**
   * ILLUSTRATIVE figures, not real ratings: the owner asked to see the review badges before the
   * profiles exist. They are shown only on preview deployments (VERCEL_ENV "preview") and in local
   * dev, never in production; `shownReview()` in src/content/reviews.ts enforces this. The links go
   * to the platforms' home pages because there are no profile URLs yet. Real figures go in `reviews`.
   */
  previewReviews: {
    google: { rating: 4.9, count: 127, url: "https://www.google.com/maps" } as ReviewProfile,
    trustpilot: { rating: 4.8, count: 64, url: "https://www.trustpilot.com" } as ReviewProfile,
  },
  /** Payment marks in the footer, in display order (confirmed by the owner, 27 Oct 2026). Ids are the keys of `paymentMarks` in footer-marks.ts. */
  paymentMethods: ["visa", "mastercard", "amex", "applepay", "googlepay"] as PaymentMethodId[],
  /** Dubai consumer protection, named in the complaints process. */
  consumerProtection: { name: "Dubai Economy and Tourism Consumer Protection", url: "https://consumerrights.ae", phone: "600 545 555" },
  /**
   * Before launch: bookings, accounts and payments run in the browser (no backend yet) and
   * search engines are kept out (robots.txt and noindex). Nothing on the page says so.
   */
  demo: true,
} as const;

export type Site = typeof site;
