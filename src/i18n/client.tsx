"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { localeHref } from "./config";
import { translate, type Vars } from "./translate";

type Messages = Record<string, Record<string, unknown>>;

const I18nContext = createContext<{ locale: string; messages: Messages }>({ locale: "en", messages: {} });

export function I18nProvider({ locale, messages, children }: { locale: string; messages: Messages; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

/** Client translator for one namespace: `const t = useT("booking"); t("steps.trip")`. */
export function useT(namespace: string) {
  const { messages } = useContext(I18nContext);
  return useCallback((key: string, vars?: Vars) => translate(messages[namespace], key, vars), [messages, namespace]);
}

export function useLocale() {
  return useContext(I18nContext).locale;
}

/** Locale-aware path builder for client components: `const href = useHref(); href("/cars")`. */
export function useHref() {
  const locale = useLocale();
  return useCallback((path: string) => localeHref(locale, path), [locale]);
}
