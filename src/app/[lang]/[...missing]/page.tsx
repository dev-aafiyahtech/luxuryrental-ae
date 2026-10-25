import { notFound } from "next/navigation";

// Any URL that matches no page (e.g. /ar/xyz) lands here, so it gets the site's own 404
// in the right language and direction instead of Next's unstyled default.

// It renders nothing but the 404, so there is no shell to validate for instant navigation.
export const instant = false;

export async function generateStaticParams() {
  return [{ missing: ["404"] }];
}

export default function Missing() {
  notFound();
}
