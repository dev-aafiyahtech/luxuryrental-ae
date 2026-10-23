import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n/config";

// English is served without a prefix: "/cars" is rewritten to "/en/cars" internally,
// and a visit to "/en/cars" is redirected to "/cars" so each page has one URL.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  if (first === defaultLocale) {
    const rest = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(new URL(`${rest}${search}`, request.url), 308);
  }
  if ((locales as readonly string[]).includes(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
