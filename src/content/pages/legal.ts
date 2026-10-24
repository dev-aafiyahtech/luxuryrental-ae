import { cars } from "@/content/cars";
import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { getZone } from "@/content/zones";
import { formatAED } from "@/lib/format";
import { advanceRule, refundWindows } from "./cancellation";
import {
  carsInTier, commonKmPerDay, depositRange, kmExceptions, legalUpdated, listJoin, noticeText, tierName, tierOrder, salikTariff,
} from "./shared";

// Legal pages (workstream 05 §2 and §4): website summaries written from the assumed rules
// for the demo. Each page notes that a UAE lawyer reviews the final text before launch.
// Every number is read from the data modules.
//
// Paragraphs use the copy mini-markup: **bold**, [label](/path).

export type LegalBlock =
  | string
  | { list: string[]; ordered?: boolean }
  | { table: { caption: string; head: string[]; rows: string[][] } };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  version: string;
  updated: string;
  summary: string;
  meta: { title: string; description: string };
  sections: LegalSection[];
}

const VERSION = "1.0 (demo)";
const { L, S, H } = rules.tiers;
const c = rules.chauffeur;
const { from, to } = rules.handoverHours;
const dubai = getZone("dubai")!;
const dxb = getZone("dxb")!;
const who = `${site.legalName}, trading as ${site.businessName}`;
const address = `${site.address.line1}, ${site.address.area}, ${site.address.city}, ${site.address.country}`;
const kmDefault = commonKmPerDay();
const kmOther = kmExceptions().map((car) => `${car.rates.kmPerDay} km on the ${car.model}`);

const contactSection = (extra?: string): LegalSection => ({
  id: "contact",
  title: "Contact",
  blocks: [
    `${who}. ${address}. WhatsApp and phone ${site.whatsappDisplay}, email ${site.email}. ${site.hours}.`,
    ...(extra ? [extra] : []),
  ],
});

const refundTable = {
  caption: "Refund of the advance, counted from the booked start time",
  head: ["Refund of advance", ...refundWindows.map((w) => w.label)],
  rows: [
    ["100%", ...refundWindows.map((w) => w.full)],
    ["50%", ...refundWindows.map((w) => w.half)],
    ["None", ...refundWindows.map((w) => w.none)],
  ],
};

export const legalDocs: LegalDoc[] = [
  // ---------------------------------------------------------------------------------------
  {
    slug: "terms-of-rental",
    title: "Terms of Rental",
    version: VERSION,
    updated: legalUpdated,
    summary: "How renting a car from us works: who can drive, booking and payment, the deposit, insurance, use of the car, and what happens at the end of the rental. The rental agreement you sign at handover has the full terms.",
    meta: { title: "Terms of Rental", description: "Website summary of our rental terms: drivers, booking and payment, deposit, insurance, use of the car, fuel, tolls, fines and returns." },
    sections: [
      {
        id: "who-we-are",
        title: "Who we are",
        blocks: [
          `These terms are a website summary of how we rent cars. They apply to every booking made through ${site.domain}, WhatsApp or by phone with ${who} ("we", "us"), ${address}. Trade licence ${site.tradeLicence}, issued by ${site.licenceAuthority}. RTA rental permit ${site.rtaPermit}.`,
          "The rental agreement you sign at handover contains the full terms. If it differs from this summary, the rental agreement applies.",
        ],
      },
      {
        id: "definitions",
        title: "Definitions",
        blocks: [{
          list: [
            "**Booking request:** the details you send us through the website, WhatsApp or by phone. It is not yet a booking.",
            "**Booking:** a request we have confirmed in writing, usually on WhatsApp.",
            "**Main driver:** the person named first on the rental agreement, who must attend the handover.",
            "**Rental period:** from the agreed handover time to the return time, counted in 24-hour days.",
            "**Deposit:** a refundable amount held on the main driver's credit card during and after the rental.",
            "**Excess:** the most you pay for each damage claim when the insurance applies.",
            `**Tier:** the group a car belongs to for these rules: ${listJoin(tierOrder.map((t) => tierName(t)))}.`,
          ],
        }],
      },
      {
        id: "eligibility",
        title: "Eligibility and drivers",
        blocks: [
          {
            list: tierOrder.map((t) => {
              const tier = rules.tiers[t];
              return `**${tier.name}** (${listJoin(carsInTier(t).map((car) => car.name))}): main driver aged ${tier.minAge} or older, with a full licence held for at least ${tier.licenceYears} years.${t === "H" ? " Approval from our team and our insurer is also required." : ""}`;
            }),
          },
          "UAE residents must drive on a valid UAE licence. Visitors may drive on a licence from a GCC country or from a country on the RTA's approved list; other visitors need an International Driving Permit together with their home licence. Licences must be full and valid for the whole rental.",
          `Additional drivers must meet the same rules and be named on the rental agreement, at ${formatAED(rules.additionalDriverPerDay)} per driver per day. Driving by anyone who is not named voids the insurance.`,
          "The [rental requirements](/requirements) page lists the documents to bring.",
        ],
      },
      {
        id: "booking",
        title: "Booking, confirmation and payment",
        blocks: [
          `Booking requests are free and nothing is charged on this website. A booking exists only when we confirm it in writing. ${site.replyPromise}`,
          `${advanceRule} You pay the rest of the rental at handover, or by a secure payment link we send after confirmation.`,
          `Luxury cars and supercars can be booked from ${noticeText(L.leadHours)} ahead, hypercars from ${noticeText(H.leadHours)} ahead and chauffeur bookings from ${noticeText(c.leadHours)} ahead. You can book up to ${Math.round(rules.maxAdvanceDays / 30.4)} months ahead. Requests for more than ${rules.maxOnlineDays} days are handled on WhatsApp.`,
        ],
      },
      {
        id: "prices",
        title: "Prices, VAT and deposit",
        blocks: [
          `All prices are in UAE dirhams (AED) and include ${site.vatRate}% VAT. You receive a tax invoice for every rental. The price that applies is the one in our written confirmation.`,
          `A refundable security deposit is held on a credit card in the main driver's name at handover: ${depositRange(carsInTier("L"))} for Luxury cars, ${depositRange(carsInTier("S"))} for supercars and ${depositRange(carsInTier("H"))} for hypercars, depending on the car. Debit cards and cash are not accepted for the deposit.`,
          `We release the hold ${L.releaseDays === S.releaseDays ? `${L.releaseDays} days` : `${L.releaseDays} or ${S.releaseDays} days`} after the return (${H.releaseDays} days for hypercars), less any fines, tolls or charges under these terms. Your bank may take a further ${rules.bankReleaseWorkingDays} working days. Fines that arrive later are charged to the card on file, and we send you the fine notice.`,
        ],
      },
      {
        id: "delivery",
        title: "Delivery, collection and handover",
        blocks: [
          `You can collect and return the car at our ${site.address.area} office at no charge. Delivery and collection anywhere in Dubai cost ${formatAED(dubai.fee ?? 0)} each way, and are free for rentals of ${dubai.freeFromDays} days or more. Other zones and airports have their own fees, listed on the [delivery page](/delivery). Airport handovers at DXB or DWC cost ${formatAED(dxb.fee ?? 0)} each and include parking and meet-and-greet.`,
          `Handovers run from ${from} to ${to}. Handovers outside these hours cost ${formatAED(rules.outOfHoursFee)} extra, subject to availability. We arrive within ${rules.slotToleranceMinutes} minutes of the agreed time. The handover takes ${rules.handoverMinutes} minutes, and the main driver must attend with original documents. We record the car's condition, km and fuel together with you.`,
          "You may return the car at a different place. The fee for that zone applies.",
        ],
      },
      {
        id: "use",
        title: "Use of the car",
        blocks: [
          "You may drive the car within the UAE only. Without our written approval, the following are not allowed:",
          { list: ["Crossing into Oman or any other country", "Off-road, sand or desert driving", "Track use, racing or speed testing", "Ride-hailing, hire or reward", "Commercial filming or photography" ] },
          `No smoking, vaping or pets in the car (assistance animals are welcome). Cleaning or odour treatment costs ${formatAED(rules.cleaningFee)}. Supercars and hypercars take Super 98 fuel only.`,
        ],
      },
      {
        id: "insurance",
        title: "Insurance, excess and exclusions",
        blocks: [
          "Comprehensive insurance is included. For each damage claim you pay up to the excess for the car's tier:",
          {
            table: {
              caption: "Excess and Full Cover by tier",
              head: ["Tier", "Excess", "Full Cover", "Excess with Full Cover"],
              rows: tierOrder.map((t) => {
                const tier = rules.tiers[t];
                return [tier.name, formatAED(tier.excess), `${formatAED(tier.fullCoverPerDay)} / day`, formatAED(tier.fullCoverExcess)];
              }),
            },
          },
          "Full Cover also covers tyres, rims and glass. No insurance applies, and you pay the full cost of any loss or damage, for:",
          { list: ["Driving under the influence of alcohol or drugs", "Driving by anyone not named on the rental agreement", "Racing or track use", "Off-road or sand driving", "Taking the car outside the UAE", "Damage with no police report"] },
        ],
      },
      {
        id: "accidents",
        title: "Accidents, damage, breakdown and theft",
        blocks: [
          "Report any accident or damage to the police (Dubai Police app or 999) and to us straight away. Without a police report you pay the full repair cost.",
          `Damage is charged from an agency-garage estimate, capped at the excess when the insurance applies. Loss of use while the car is repaired is ${rules.lossOfUsePct}% of the daily rate, for up to ${rules.lossOfUseMaxDays} days.`,
          "If the car breaks down, stop somewhere safe and contact us. Do not arrange repairs yourself. If the car is stolen, report it to the police and to us at once.",
        ],
      },
      {
        id: "fuel-km-tolls-fines",
        title: "Fuel, kilometres, Salik, Darb, fines and black points",
        blocks: [
          { list: [
            `**Fuel:** return the car with the same fuel level. If it is lower, we charge fuel at pump price plus ${formatAED(rules.refuelFee)}.`,
            `**Kilometres:** each car includes a daily allowance (${kmDefault} km on most cars${kmOther.length ? `, ${listJoin(kmOther)}` : ""}). Extra kilometres are charged at the rate shown for the car on our [pricing page](/pricing).`,
            `**Tolls:** Salik and Darb crossings are charged at the operator's tariff (currently ${salikTariff()}) plus ${formatAED(rules.tollAdminFee)} per crossing.`,
            `**Fines:** traffic and parking fines during the rental are your responsibility. We charge the fine plus ${formatAED(rules.fineAdminFee)} admin per fine and, where the authority allows, transfer the fine and black points to the driver's licence.`,
            "**Impound:** if the car is impounded because of how it was driven, you pay the impound and release costs and loss of use.",
          ] },
        ],
      },
      {
        id: "returns",
        title: "Late, extended and early returns",
        blocks: [
          `Returns up to ${rules.graceMinutes} minutes late are free. After that, each started hour costs ${rules.lateReturnHourPct}% of the daily rate, up to one extra day.`,
          "To extend, ask us before the rental ends. Extensions depend on availability and are priced at the rates in force.",
          "If you return the car early, we re-price the rental at the rate for the days you used and refund any difference.",
        ],
      },
      {
        id: "cancellation",
        title: "Cancellation",
        blocks: ["Booking requests are free to cancel before we confirm them. Refunds for confirmed bookings follow our [cancellation and refund policy](/legal/cancellation)."],
      },
      {
        id: "tracking",
        title: "Vehicle tracking",
        blocks: ["Our cars have GPS trackers for security and recovery. We check a car's location only in case of theft, an emergency, an accident or a suspected breach of these terms. Our [privacy notice](/legal/privacy) explains how long we keep tracking data."],
      },
      {
        id: "liability",
        title: "Liability",
        blocks: [
          "We are not responsible for personal belongings left in the car. We are not liable for indirect losses, such as missed flights or events, caused by delays outside our control.",
          "Nothing in these terms limits any liability that cannot be limited under UAE law, or your rights under UAE consumer protection law.",
        ],
      },
      {
        id: "precedence",
        title: "Rental agreement",
        blocks: ["Once we confirm your request, we issue a rental agreement for the specific car. You can sign it online in advance or at handover. It sets out the full terms and takes precedence over this summary. At handover we check the car with you and record its condition, fuel and km in a condition report that you sign too, and we do the same at return."],
      },
      {
        id: "law",
        title: "Governing law and courts",
        blocks: ["These terms are governed by the laws of the Emirate of Dubai and the federal laws of the United Arab Emirates. The courts of Dubai have jurisdiction."],
      },
      {
        id: "changes",
        title: "Changes to these terms",
        blocks: ["We may update these terms. The version and date at the top of this page show which version is current. A confirmed booking follows the terms in force when we confirmed it."],
      },
      contactSection(),
    ],
  },

  // ---------------------------------------------------------------------------------------
  {
    slug: "cancellation",
    title: "Cancellation and Refund Policy",
    version: VERSION,
    updated: legalUpdated,
    summary: "Booking requests are free to cancel at any time before we confirm them. After confirmation, how much of your advance we refund depends on the car and on how close to the start you cancel.",
    meta: { title: "Cancellation and Refund Policy", description: "Free cancellation before confirmation. Refund windows for Luxury, Supercar, Hypercar and chauffeur bookings, date changes, flight delays and refunds." },
    sections: [
      {
        id: "summary",
        title: "Summary",
        blocks: [
          { table: refundTable },
          "This policy does not limit your rights under UAE consumer protection law.",
        ],
      },
      {
        id: "requests",
        title: "Booking requests",
        blocks: ["A booking request is free and can be cancelled at any time before we confirm it, at no cost. Nothing is charged on this website."],
      },
      {
        id: "confirmed",
        title: "Confirmed bookings",
        blocks: [
          `${advanceRule} If you cancel a confirmed booking, we refund the advance according to the table above, counted from the booked start time.`,
          refundWindows.filter((w) => w.id === "standard").map((w) => `For Luxury cars and supercars: the full advance ${w.full} the start, half of it ${w.half}, and nothing ${w.none.toLowerCase()}.`)[0],
        ],
      },
      {
        id: "hypercars",
        title: "Hypercars",
        blocks: [refundWindows.filter((w) => w.id === "hypercar").map((w) => `Hypercar bookings need more preparation, so the windows are longer: the full advance ${w.full} the start, half of it ${w.half}, and nothing ${w.none.toLowerCase()}.`)[0]],
      },
      {
        id: "chauffeur",
        title: "Chauffeur bookings",
        blocks: [refundWindows.filter((w) => w.id === "chauffeur").map((w) => `For chauffeur bookings: the full advance ${w.full} the start, half of it ${w.half}, and nothing ${w.none.toLowerCase()}.`)[0]],
      },
      {
        id: "date-changes",
        title: "Changing dates",
        blocks: [`Each confirmed booking includes one free date change up to ${rules.freeDateChangeHours} hours before the start, subject to availability. Any difference in price applies.`],
      },
      {
        id: "early-return",
        title: "Early return",
        blocks: ["If you return the car early, we re-price the rental at the rate for the days you used and refund any difference."],
      },
      {
        id: "delivery-fees",
        title: "Delivery fees",
        blocks: ["Delivery fees are refunded in full if you cancel before the car leaves our base."],
      },
      {
        id: "if-we-cancel",
        title: "If we cancel or cannot provide your car",
        blocks: ["You choose between a full refund and a comparable or better car at no extra cost."],
      },
      {
        id: "eligibility",
        title: "Eligibility at handover",
        blocks: ["If the main driver does not meet the [rental requirements](/requirements) at handover, for example because of an expired licence or a missing International Driving Permit, it counts as a late cancellation. We check your licence country on WhatsApp before we confirm, to avoid this."],
      },
      {
        id: "flights-weather",
        title: "Flight delays, cancellations and weather warnings",
        blocks: [`If a flight delay or cancellation, or an official weather warning, stops you from starting the rental, you can change your dates free of charge within ${rules.flightChangeMonths} months or take a full refund. We ask for proof, such as the airline's notice or a National Center of Meteorology warning.`],
      },
      {
        id: "refunds",
        title: "Refund method and timing",
        blocks: [`Refunds go back to the original payment method within ${rules.refundWorkingDays} working days. Your bank may take a further ${rules.bankReleaseWorkingDays} working days to show them.`],
      },
      {
        id: "deposit",
        title: "Security deposit",
        blocks: ["The security deposit is a hold on your card, not a payment. We release it as set out in our [rental requirements](/requirements#deposit)."],
      },
      {
        id: "how-to-cancel",
        title: "How to cancel",
        blocks: [`Send us your booking reference on WhatsApp (${site.whatsappDisplay}) or by email to ${site.email}. The time we receive your message counts, and we confirm the cancellation in writing.`],
      },
      {
        id: "rights",
        title: "Your statutory rights",
        blocks: ["This policy does not limit your rights under UAE consumer protection law."],
      },
    ],
  },

  // ---------------------------------------------------------------------------------------
  {
    slug: "privacy",
    title: "Privacy Notice",
    version: VERSION,
    updated: legalUpdated,
    summary: "What personal data we collect when you use this website, send a booking request or rent a car, why we use it, who we share it with, where it is stored and how long we keep it.",
    meta: { title: "Privacy Notice", description: "How Luxuryrentals collects, uses, shares and stores personal data for booking requests and rentals, including storage outside the UAE and your rights." },
    sections: [
      {
        id: "who-we-are",
        title: "Who we are and how to contact us",
        blocks: [`${who} is responsible for your personal data. ${address}. For privacy questions or requests, email ${site.privacyEmail} or message us on WhatsApp at ${site.whatsappDisplay}.`],
      },
      {
        id: "what-we-collect",
        title: "What we collect",
        blocks: [{
          list: [
            "**Website:** basic technical data such as pages visited and device type, through cookieless analytics. See our [cookie policy](/legal/cookies).",
            "**Booking request:** name, mobile or WhatsApp number, email (optional), the car, dates, times and places, self-drive or chauffeur, the main driver's age band, licence country, whether you live in the UAE, your flight number for airport handovers, your notes and a record of the consents you gave.",
            "**Account (optional):** your name, mobile number, email, licence country and residency, so you can follow your requests and sign documents. You sign in with a one-time code; there is no password.",
            "**Document uploads (optional):** photos or PDFs of your passport or Emirates ID, visa or entry stamp, driving licence and International Driving Permit, so we can check them before handover. We never collect card details or date of birth online.",
            "**E-signatures:** your typed name, drawn signature and the time you signed the rental agreement and condition reports.",
            "**At handover:** copies of the passport or Emirates ID, licence and International Driving Permit attached to the rental agreement, the signed agreement, the deposit authorisation reference, condition photos, km and fuel.",
            "**During and after the rental:** fines and toll notices, damage reports, invoices and the deposit release.",
            "**Vehicle tracking:** the car's GPS location, used only as described below.",
            "**WhatsApp:** the messages and files you send us.",
          ],
        }],
      },
      {
        id: "why",
        title: "Why we use it, and our lawful basis",
        blocks: [{
          list: [
            "**To handle your request and rental:** steps you asked us to take before a contract, and performing the rental contract.",
            "**To meet legal duties:** tax invoices, RTA and police requests, traffic fines and accounting records.",
            "**To protect our cars:** our legitimate interest in preventing theft and misuse, including GPS checks in the cases listed below.",
            "**To send offers and new arrivals:** only with your separate consent, which you can withdraw at any time. Saying no never affects a booking.",
          ],
        }],
      },
      {
        id: "sharing",
        title: "Who we share it with",
        blocks: [
          "We share only what each recipient needs:",
          { list: [
            "Our website hosting provider",
            "Our booking database provider",
            "Our email service provider",
            "Meta (WhatsApp), when you message us. Meta's own privacy policy applies to WhatsApp.",
            "Our payment provider, once online payments are introduced",
            "Our insurer, for claims",
            "The RTA, Dubai Police, Salik and other authorities, for fines, tolls or lawful requests",
          ] },
          "We do not sell your personal data. Each disclosure to an authority or insurer is logged.",
        ],
      },
      {
        id: "transfers",
        title: "Transfers outside the UAE",
        blocks: ["Your booking data may be stored outside the UAE. At launch our booking database is hosted in the European Union, and our website, email and messaging providers may process data in other countries. We use these providers under data processing agreements and apply the safeguards required by the UAE Personal Data Protection Law, relying on contracts with those providers and, where needed, your consent."],
      },
      {
        id: "retention",
        title: "How long we keep it",
        blocks: [{
          table: {
            caption: "Retention periods",
            head: ["Record", "How long"],
            rows: [
              ["Requests that never become rentals", "Deleted 90 days after the requested end date"],
              ["Uploaded documents for a request that never becomes a rental", "Deleted 30 days after the requested end date"],
              ["ID and licence copies, completed rental", "12 months after return, or until open fines or claims close"],
              ["Your account", "Until you delete it, or 24 months after your last sign-in"],
              ["Rental agreements, invoices and payment records", "At least 5 years from the end of the tax period"],
              ["Condition photos", "12 months after return, or until any claim closes"],
              ["GPS trip data", "90 days after return, unless there is an incident"],
              ["WhatsApp media", "Deleted from phones within 7 days of verification; chats kept 12 months"],
              ["Consent and opt-out records", "The life of the consent plus 5 years"],
              ["Server and form logs (no personal data)", "30 days"],
            ],
          },
        }],
      },
      {
        id: "tracking",
        title: "Vehicle tracking",
        blocks: ["Our cars carry GPS trackers for security and recovery. We look at a car's location only for theft, emergencies, accidents or a suspected breach of the rental terms. We do not monitor trips routinely."],
      },
      {
        id: "security",
        title: "Security",
        blocks: ["Data is encrypted in transit and at rest. Staff access depends on their role, every account uses multi-factor authentication, and access is logged and reviewed. We keep no personal data in analytics, page addresses or error logs."],
      },
      {
        id: "rights",
        title: "Your rights",
        blocks: [
          "You can ask to access, correct or delete your personal data, to restrict or object to how we use it, and to receive a copy in a portable format. You can withdraw marketing consent at any time by replying STOP or emailing us.",
          `Send requests to ${site.email}. We aim to reply within ${rules.rightsReplyDays} days.`,
        ],
      },
      {
        id: "complaints",
        title: "Complaints",
        blocks: ["If you are unhappy with how we handle your data, tell us first and we will try to put it right. You can also complain to the UAE Data Office."],
      },
      {
        id: "cookies",
        title: "Cookies",
        blocks: ["Our [cookie policy](/legal/cookies) explains the small amount of browser storage this site uses."],
      },
      {
        id: "children",
        title: "Children",
        blocks: [`Our services are for adults. Drivers must be ${L.minAge} or older, and we do not knowingly collect data from children.`],
      },
      {
        id: "demo",
        title: "This demo",
        blocks: ["While this website runs as a demo, booking requests, accounts, document uploads, signatures and payments are simulated. What you enter is stored only in your own browser and is never sent to us. Uploaded files are not stored at all: the demo keeps only their name and size."],
      },
      {
        id: "changes",
        title: "Changes to this notice",
        blocks: ["We may update this notice. The version and date at the top show which version is current."],
      },
    ],
  },

  // ---------------------------------------------------------------------------------------
  {
    slug: "cookies",
    title: "Cookie Policy",
    version: VERSION,
    updated: legalUpdated,
    summary: "This site uses only the browser storage it needs to work. There are no advertising cookies and no consent banner, because we set nothing that needs consent.",
    meta: { title: "Cookie Policy", description: "The browser storage this site uses: strictly necessary items only, cookieless analytics, and no advertising cookies." },
    sections: [
      {
        id: "what",
        title: "What cookies are",
        blocks: ["Cookies and similar browser storage are small pieces of data a website keeps on your device. Some are needed for the site to work. Others track you for analytics or advertising, and those need your consent."],
      },
      {
        id: "now",
        title: "What we use now",
        blocks: [
          "We use strictly necessary browser storage only:",
          {
            table: {
              caption: "Browser storage used by this site",
              head: ["Name", "Purpose", "How long"],
              rows: [
                ["lr.trip.v1", "Keeps your trip details (car, dates, handover) while you fill in a booking request", "Until you clear it or start a new trip"],
                ["lr.bookings.v1", "Demo only: keeps the booking requests, signatures and vehicle checks made on this device", "Until you clear your browser data"],
                ["lr.account.v1", "Demo only: keeps you signed in to your account on this device", "Until you sign out, delete the account or clear your browser data"],
                ["lr.docs.v1", "Demo only: the names and sizes of documents you upload (never the files)", "Until you remove them or clear your browser data"],
                ["lr.signin-code.v1", "Demo only: the one-time sign-in code while you sign in (session storage)", "Until you close the tab"],
                ["lr.home.motionPaused", "Remembers if you paused the homepage animation", "Until you clear your browser data"],
              ],
            },
          },
          "We measure visits with cookieless analytics, which set no cookies and collect no personal data.",
        ],
      },
      {
        id: "analytics",
        title: "Analytics and advertising cookies",
        blocks: ["We do not use analytics or advertising cookies today. If we add them later, for example Google Analytics or the Meta Pixel, we will ask for your consent first with equal \"Accept all\" and \"Reject all\" choices, and nothing will load before you choose."],
      },
      {
        id: "third-parties",
        title: "Third parties",
        blocks: ["WhatsApp buttons open WhatsApp, where Meta's own policies apply. We do not embed maps or other third-party content that sets cookies."],
      },
      {
        id: "choices",
        title: "Managing your choices",
        blocks: ["You can clear or block browser storage in your browser's settings. The site still works, but a booking draft will not be kept between visits."],
      },
      {
        id: "changes",
        title: "Changes to this policy",
        blocks: ["If we change what we store, we update this page and its date first."],
      },
      contactSection(),
    ],
  },

  // ---------------------------------------------------------------------------------------
  {
    slug: "terms-of-use",
    title: "Website Terms of Use",
    version: VERSION,
    updated: legalUpdated,
    summary: `The rules for using ${site.domain}. Renting a car is covered separately by our Terms of Rental and the rental agreement.`,
    meta: { title: "Website Terms of Use", description: "Terms for using the LuxuryRental.ae website: content and prices, illustrative images, trademarks, acceptable use and links." },
    sections: [
      {
        id: "about",
        title: "About this website",
        blocks: [`${site.domain} is run by ${who}, ${address}. By using the site you accept these terms. Renting a car is covered by our [Terms of Rental](/legal/terms-of-rental).`],
      },
      {
        id: "demo",
        title: "Demo status",
        blocks: ["This website currently runs as a demo. Bookings and payments are simulated, and nothing is booked or charged."],
      },
      {
        id: "content",
        title: "Prices and content",
        blocks: [`We keep prices and car details up to date, but they can change. The price that applies to a rental is the one in our written confirmation. Specifications are typical published figures for each model and may differ slightly on the car you receive.`],
      },
      {
        id: "images",
        title: "Car images",
        blocks: ["Car images on this site are illustrations until photos of our own cars are available. The car supplied is the model listed; its colour and trim may differ from the illustration."],
      },
      {
        id: "trademarks",
        title: "Trademarks",
        blocks: [`${listJoin([...new Set(cars.map((car) => car.name.slice(0, car.name.length - car.model.length).trim()))])} are trademarks of their owners. They are used only to describe the cars we rent. ${site.businessName} is not affiliated with or endorsed by them.`],
      },
      {
        id: "acceptable-use",
        title: "Acceptable use",
        blocks: [{ list: ["Do not send false booking requests or requests in someone else's name.", "Do not try to break, overload or scrape the site.", "Do not copy our text or images for commercial use without permission."] }],
      },
      {
        id: "links",
        title: "Links to other services",
        blocks: ["Links to WhatsApp and other services take you to sites we do not control. Their own terms and privacy policies apply."],
      },
      {
        id: "liability",
        title: "Liability",
        blocks: ["We provide the site as it is and cannot promise it will always be available or error-free. Nothing in these terms limits liability that cannot be limited under UAE law."],
      },
      {
        id: "law",
        title: "Governing law",
        blocks: ["These terms are governed by the laws of the Emirate of Dubai and the federal laws of the United Arab Emirates. The courts of Dubai have jurisdiction."],
      },
      contactSection(),
    ],
  },

  // ---------------------------------------------------------------------------------------
  {
    slug: "accessibility",
    title: "Accessibility Statement",
    version: VERSION,
    updated: legalUpdated,
    summary: "We want everyone to be able to browse our cars and send a booking request, including people who use a keyboard, a screen reader or reduced motion.",
    meta: { title: "Accessibility Statement", description: "Our accessibility target (WCAG 2.2 AA), what we have built in, known limitations and how to report a problem." },
    sections: [
      {
        id: "commitment",
        title: "Our target",
        blocks: ["We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA across this website, and we test the booking flow and these legal pages against it before launch."],
      },
      {
        id: "built-in",
        title: "What we have built in",
        blocks: [{
          list: [
            "Every page works with a keyboard, with a visible focus outline.",
            "Form fields have visible labels, and errors are explained in text next to the field.",
            "Text and controls meet AA contrast on our dark background.",
            "Buttons and links are at least 44 pixels tall on touch screens.",
            "If your device asks for reduced motion, we show still images instead of animation and smooth scrolling.",
            "The homepage animation has a pause control.",
            "Car images have text alternatives, and every price and specification is available as text.",
            "Questions and answers use standard disclosure elements that work without JavaScript.",
          ],
        }],
      },
      {
        id: "limitations",
        title: "Known limitations",
        blocks: [{
          list: [
            "The site is in English only. An Arabic version is planned.",
            "Car images are illustrations until photos of our own cars are available.",
            "Some wide tables scroll sideways on small screens. The first column stays in view.",
          ],
        }],
      },
      {
        id: "feedback",
        title: "Tell us about a problem",
        blocks: [`If something on this site does not work for you, message us on WhatsApp at ${site.whatsappDisplay} or email ${site.email}. Tell us the page and what happened. We reply within ${rules.complaintReplyWorkingDays} working days and can take your booking request by WhatsApp or phone in the meantime.`],
      },
      {
        id: "review",
        title: "Review",
        blocks: ["We review this statement before launch and after any major change to the site."],
      },
    ],
  },
];

export const getLegalDoc = (slug: string) => legalDocs.find((d) => d.slug === slug);
