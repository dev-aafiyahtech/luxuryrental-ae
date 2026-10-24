# Arabic (RTL) guide

The site runs in English at `/` and Arabic at `/ar`. The Arabic is a demo translation (machine-assisted, written for UAE readers) to be reviewed by a translator and, for legal text, a UAE lawyer before launch. Read `docs/dev/FRONTEND-GUIDE.md` first; everything there still applies.

## How locales work in the code

- `src/i18n/config.ts`: `locales = ["en", "ar"]`, `dirOf(locale)` gives `rtl` for Arabic. The root layout sets `<html lang dir>`.
- Locale: `await getLocale()` in Server Components (`src/i18n/dictionaries.ts`), `useLocale()` in Client Components (`src/i18n/client.tsx`).
- UI strings: `src/messages/ar/<namespace>.json` has exactly the keys of `src/messages/en/<namespace>.json`. Check with `node qa/scripts/i18n-keys.mjs`.
- Dates and money: the helpers in `src/lib/dates.ts` and `src/lib/format.ts` take an optional last `locale` argument: `formatAED(n, locale)`, `formatPerDay(n, locale)`, `formatDay(iso, locale)`, `formatDayLong(iso, locale)`, `formatRange(a, b, locale)`, `monthName(m, long, locale)`, `weekdayName(i, long, locale)`, `formatSeconds(s, locale)`, `formatTopSpeed(kmh, note, locale)`. Always pass the locale where text is shown.
- Data text (car taglines, specs text, trim, categories, zones, offers, seasons, tiers, some rules and site settings): `src/content/localize.ts` (`localizeCar`, `localizeCars`, `localizeCategory`, `localizeZone`, `localizeZones`, `localizeOffer`, `seasonName`, `tierName`, `chauffeurIncluded`, `cancellationSummary`, `siteFor`) reading `src/content/ar/data.ts`. Localize at the edge (the page, or the client component that reads data) and pass the localized object down.
- Marketing copy: `copyFor(locale)` in `src/content/copy.ts`, Arabic in `src/content/copy.ar.ts`.
- Page body copy: Arabic modules in `src/content/pages/ar/`, same exports and shapes as `src/content/pages/*.ts`; pages pick the module by locale.
- Links: `getHref()` / `useHref()` already add `/ar`. Never hard-code a locale prefix.
- Numbers, prices, slugs, rules and dates never differ between locales; only the words do.

## Writing Arabic for this site

- Modern Standard Arabic, polished and warm, short sentences, the tone of a UAE luxury brand. Address the reader directly.
- Western digits (0–9), as on UAE commerce sites: "3,500 درهم". Prices in prose: amount then "درهم". Units: كم، كم/س، ث، ساعة، يوم.
- Brand and model names stay in Latin script, exactly as in English: Lamborghini Revuelto, Rolls-Royce Cullinan Series II. Paint names stay as the maker writes them.
- Place names in Arabic, with the airport code where English has it: دبي مارينا، نخلة جميرا، مطار دبي الدولي (DXB)، مطار آل مكتوم الدولي (DWC)، واحة دبي للسيليكون.
- Keep `{placeholders}` exactly, and keep the copy mini-markup: `**bold**`, `[label](/path)` (translate the label, never the path).

### Terms (use these consistently)

| English | Arabic |
|---|---|
| booking request / request | طلب حجز / طلب |
| confirmed (by ops) | مؤكد / تم التأكيد |
| reserve (button) | اطلب الحجز |
| self-drive | قيادة ذاتية |
| with a chauffeur / chauffeur | مع سائق خاص / سائق خاص |
| delivery / collection | توصيل / استلام السيارة منك |
| pickup / return (rental times) | الاستلام / الإرجاع |
| handover | التسليم |
| deposit (refundable card hold) | مبلغ التأمين (حجز مسترد على بطاقتك) |
| excess | مبلغ التحمّل |
| Full Cover | التغطية الشاملة |
| VAT | ضريبة القيمة المضافة |
| Salik / Darb | سالك / درب |
| fines / black points | المخالفات / النقاط السوداء |
| WhatsApp | واتساب |
| our team / ops | فريقنا |
| Illustrative AI image | صورة توضيحية مُنشأة بالذكاء الاصطناعي |
| demo | نسخة تجريبية |
| account / sign in / one-time code | الحساب / تسجيل الدخول / رمز لمرة واحدة |
| rental agreement / vehicle check | عقد الإيجار / فحص السيارة |

### Content rules in Arabic

- Never say a car is booked or reserved (محجوز، تم الحجز) before our team confirms; say طلب.
- Nothing is charged on the website; in the demo, payments are simulated (دفع تجريبي، دون أي رسوم).
- No invented reviews, ratings, customer counts or founding years.
- Legal pages carry the note: «ترجمة لأغراض النسخة التجريبية. يراجع محامٍ في الإمارات النص النهائي قبل الإطلاق.»

## Right to left

- Use logical CSS only (`ms- me- ps- pe- start- end- text-start text-end`). Directional icons (arrows, chevrons) flip with `rtl:-scale-x-100`. Never mirror car images or the logo.
- Mixed text: wrap Latin runs that must not reorder (phone numbers, references like LR-7K3QZM, plate formats, URLs, emails, times ranges) in `dir="ltr"` (`<span dir="ltr">`) or use `unicode-bidi: isolate`.
- Arabic is not uppercased and has no letter-spacing: `:lang(ar)` resets tracking and text-transform (globals.css).
- Fonts: Arabic display and body faces are set for `:lang(ar)`; Latin names inside Arabic text fall back to the Latin faces.
