"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { localeHref } from "./config";

type Messages = Record<string, Record<string, unknown>>;
type Vars = Record<string, string | number>;

const I18nContext = createContext<{ locale: string; messages: Messages }>({ locale: "en", messages: {} });

export function I18nProvider({ locale, messages, children }: { locale: string; messages: Messages; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

function lookup(messages: Record<string, unknown> | undefined, key: string, vars?: Vars): string {
  const value = key.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), messages);
  if (typeof value !== "string") return key;
  return vars ? value.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`)) : value;
}

/** Client translator for one namespace: `const t = useT("booking"); t("steps.trip")`. */
export function useT(namespace: string) {
  const { messages } = useContext(I18nContext);
  return useCallback((key: string, vars?: Vars) => lookup(messages[namespace], key, vars), [messages, namespace]);
}

export function useLocale() {
  return useContext(I18nContext).locale;
}

/** Locale-aware path builder for client components: `const href = useHref(); href("/cars")`. */
export function useHref() {
  const locale = useLocale();
  return useCallback((path: string) => localeHref(locale, path), [locale]);
}
