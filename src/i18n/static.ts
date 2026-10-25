import enCommon from "@/messages/en/common.json";
import arCommon from "@/messages/ar/common.json";
import { translate, withFallback, type Vars } from "./translate";

// Synchronous translator for the shared "common" namespace, for helpers that can't await
// getT() or call useT(): components rendered on both the server and the client (CarArt) and
// plain functions (specRows, headlineSpecs, callouts). Pass the locale from the page.

const common = { en: enCommon, ar: withFallback(enCommon, arCommon) };

export function commonT(locale?: string) {
  const messages = locale === "ar" ? common.ar : common.en;
  return (key: string, vars?: Vars) => translate(messages, key, vars);
}
