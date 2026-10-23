import { redirect } from "next/navigation";
import { getHref } from "@/i18n/dictionaries";

// The demo area currently has one page: the simulated ops desk.
export default async function DemoIndex() {
  const href = await getHref();
  redirect(href("/demo/ops"));
}
