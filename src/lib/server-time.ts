import { cacheLife } from "next/cache";
import { todayInDubai } from "./dates";

// With Cache Components, reading the clock during prerender is not allowed outside a cache
// scope. Server Components get "today" (Dubai) from here and pass it down, e.g. to fromPrice().
export async function getToday(): Promise<string> {
  "use cache";
  cacheLife("hours");
  return todayInDubai();
}
