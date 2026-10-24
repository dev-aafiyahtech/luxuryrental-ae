"use client";

import { CircleCheck, PenLine } from "lucide-react";
import { useHref, useT } from "@/i18n/client";
import { useBookings } from "@/lib/booking/draft";
import { agreementFor } from "@/lib/booking/store";
import type { BookingRecord } from "@/lib/booking/types";
import type { CustomerProfile } from "@/lib/customer/store";
import { formatDay, formatRange } from "@/lib/dates";
import { StatusBadge, rich } from "@/components/booking/bits";
import { formatPhone } from "@/components/booking/lib";
import { ButtonLink } from "@/components/ui";

/** Requests sent with the profile's phone or email (case-insensitive), newest first. */
export function requestsFor(bookings: BookingRecord[], profile: CustomerProfile): BookingRecord[] {
  const email = profile.email?.trim().toLowerCase();
  return bookings
    .filter((b) => {
      const d = b.trip.driver;
      return (!!profile.phone && d.phone === profile.phone) || (!!email && d.email?.trim().toLowerCase() === email);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function RequestRow({ b }: { b: BookingRecord }) {
  const t = useT("account");
  const href = useHref();
  const trip = b.trip;
  const chauffeur = trip.service === "chauffeur";
  const when = chauffeur ? (trip.pickupDate ? `${formatDay(trip.pickupDate)}, ${trip.pickupTime}` : "") : trip.pickupDate && trip.returnDate ? formatRange(trip.pickupDate, trip.returnDate) : "";
  const agreement = agreementFor(b);
  // Names that start with the visible text and say which request (several rows share the same buttons).
  const named = (action: string) => t("requests.action", { action, car: b.carName, ref: b.ref });

  return (
    <li className="card grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="grid min-w-0 gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-[15px] font-semibold leading-snug">{b.carName}</h3>
          <StatusBadge status={b.status} />
        </div>
        <p className="text-sm tabular text-champagne">{[when, chauffeur ? t("requests.chauffeur") : t("requests.selfDrive")].filter(Boolean).join(" · ")}</p>
        <p className="text-[12px] text-muted">
          {t("requests.ref")}{" "}
          <span dir="ltr" className="font-semibold tabular tracking-[0.06em] text-fg">
            {b.ref}
          </span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        <ButtonLink href={href(`/booking?ref=${b.ref}`)} variant="secondary" size="sm" aria-label={named(t("requests.view"))}>
          {t("requests.view")}
        </ButtonLink>
        {agreement &&
          (agreement.signedAt ? (
            <ButtonLink href={href(`/booking/agreement?ref=${b.ref}`)} variant="ghost" size="sm" aria-label={named(t("requests.signed"))}>
              <CircleCheck className="h-4 w-4 text-success" aria-hidden="true" />
              {t("requests.signed")}
            </ButtonLink>
          ) : (
            <ButtonLink href={href(`/booking/agreement?ref=${b.ref}`)} size="sm" aria-label={named(t("requests.sign"))}>
              <PenLine className="h-4 w-4" aria-hidden="true" />
              {t("requests.sign")}
            </ButtonLink>
          ))}
      </div>
    </li>
  );
}

export function RequestsList({ profile }: { profile: CustomerProfile }) {
  const t = useT("account");
  const href = useHref();
  const bookings = useBookings();
  const mine = requestsFor(bookings, profile);
  const strong = (text: string) => <bdi className="font-semibold text-fg">{text}</bdi>;
  const phone = profile.phone ? strong(formatPhone(profile.phone)) : null;
  const email = profile.email ? strong(profile.email) : null;
  const contact = phone && email ? rich(t("requests.or"), { a: phone, b: email }) : phone || email;

  return (
    <section id="requests" aria-labelledby="requests-h" className="grid content-start gap-5">
      <header className="grid gap-2">
        <h2 id="requests-h" className="display-sm">
          {t("requests.title")}
        </h2>
        <p className="text-sm text-champagne">{rich(t("requests.intro"), { contact })}</p>
      </header>
      {mine.length === 0 ? (
        <div className="card grid justify-items-start gap-3 p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold">{t("requests.empty")}</h3>
          <p className="text-sm text-muted">{t("requests.emptyText")}</p>
          <ButtonLink href={href("/cars")} variant="secondary" size="sm">
            {t("requests.browse")}
          </ButtonLink>
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {mine.map((b) => (
            <RequestRow key={b.ref} b={b} />
          ))}
        </ul>
      )}
    </section>
  );
}
