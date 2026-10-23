import { redirect } from "next/navigation";
import { getHref } from "@/i18n/dictionaries";

// /book has no page of its own: start at the trip step.
export default async function BookIndex() {
  const href = await getHref();
  redirect(href("/book/trip"));
}
