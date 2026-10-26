import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { cars, getCarByPath } from "@/content/cars";
import { carMedia } from "@/content/car-media";
import { getBrand } from "@/content/brands";
import { formatAED } from "@/lib/format";
import { translate, withFallback } from "@/i18n/translate";
import enFleet from "@/messages/en/fleet.json";
import arFleet from "@/messages/ar/fleet.json";

// Share card for each car page (WhatsApp, iMessage, social): the car's AI image, its name and
// launch rate, the wordmark and the "Illustrative AI image" label. Generated at build time.
// Colours are the palette tokens written out, because the image renderer has no CSS variables.
//
// Arabic (/ar): the image renderer (Satori) can't shape Arabic or lay out right-to-left text, so
// the Arabic lines are drawn by sharp's text renderer (Pango, with full Arabic shaping and bidi)
// in Noto Kufi Arabic (OFL, assets/fonts) and placed as images; the layout mirrors, the car
// picture and the wordmark don't. Brand and model names stay in Latin script, in Syncopate.

export const alt = "A car available to rent in Dubai from LuxuryRentals.ae";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return cars.map((c) => ({ brand: c.brand, model: c.modelSlug }));
}

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Syncopate-Bold.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Syncopate-Regular.ttf")),
]);
const ARABIC_FONT = join(process.cwd(), "assets/fonts/NotoKufiArabic-Bold.ttf");
const logo = readFile(join(process.cwd(), "public/brand/logo-horizontal-white.svg"), "base64").then((b) => `data:image/svg+xml;base64,${b}`);

const messages = { en: enFleet, ar: withFallback(enFleet, arFleet) };

/** The 4:3 card image (whole car, studio continued above and below) as a JPEG data URL: the renderer doesn't read WebP. */
async function cardSrc(path?: string): Promise<string | null> {
  if (!path) return null;
  const jpg = await sharp(join(process.cwd(), "public", path)).resize(840, 630, { fit: "cover" }).jpeg({ quality: 84 }).toBuffer();
  return `data:image/jpeg;base64,${jpg.toString("base64")}`;
}

const escapeMarkup = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** One line of Arabic text, shaped by Pango, as a transparent PNG data URL with its size in px. */
async function arabicLine(text: string, px: number, color: string) {
  const { data, info } = await sharp({
    text: { text: `<span foreground="${color}">${escapeMarkup(text)}</span>`, font: `Noto Kufi Arabic Bold ${px}`, fontfile: ARABIC_FONT, rgba: true, dpi: 72 },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { src: `data:image/png;base64,${data.toString("base64")}`, width: info.width, height: info.height };
}

export default async function Image({ params }: { params: Promise<{ lang: string; brand: string; model: string }> }) {
  const { lang, brand, model } = await params;
  const ar = lang === "ar";
  const t = (key: string, vars?: Record<string, string | number>) => translate(ar ? messages.ar : messages.en, key, vars);
  const car = getCarByPath(brand, model);
  const [[bold, regular], logoSrc, hero] = await Promise.all([fonts, logo, cardSrc(car ? carMedia[car.slug]?.card : undefined)]);
  const name = car?.model ?? "LuxuryRentals.ae";
  const make = car ? getBrand(car.brand)?.name ?? "" : "";
  const price = car ? t(car.rates.onRequest ? "og.priceOnRequest" : "og.price", { price: formatAED(car.rates.daily, lang) }) : "";

  // Latin lines are uppercase as on the site; Arabic has no case.
  const [priceArt, subArt, labelArt] = ar
    ? await Promise.all([price ? arabicLine(price, 24, "#ebdab0") : null, arabicLine(t("og.sub"), 17, "#c3cec6"), arabicLine(t("og.aiLabel"), 15, "#c3cec6")])
    : [null, null, null];

  // The text column has a definite width: with only a max-width, the renderer measures a long
  // name ("Chiron Super Sport") as one line, then wraps it over the price below.
  const side = ar ? "left" : "right";
  const edge = ar ? "right" : "left";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#1d3c3c", color: "#f4eade", fontFamily: "Syncopate" }}>
        {hero && <img src={hero} width={840} height={630} alt="" style={{ position: "absolute", top: 0, [side]: 0, width: 840, height: 630 }} />}
        <div style={{ position: "absolute", top: 0, bottom: 0, [edge]: 360, width: 220, display: "flex", background: `linear-gradient(${ar ? 270 : 90}deg, #1d3c3c 0%, rgba(29,60,60,0) 100%)` }} />
        <div style={{ position: "absolute", top: 52, [edge]: 60, display: "flex" }}>
          <img src={logoSrc} width={356} height={28} alt="" />
        </div>
        <div style={{ position: "absolute", [edge]: 60, bottom: 64, display: "flex", flexDirection: "column", alignItems: ar ? "flex-end" : "flex-start", width: 420 }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: "#ebdab0", fontWeight: 400 }}>{make.toUpperCase()}</div>
          <div style={{ fontSize: name.length > 12 ? 40 : 54, fontWeight: 700, lineHeight: 1.1, marginTop: 12, textTransform: "uppercase", textAlign: ar ? "right" : "left" }}>{name}</div>
          {priceArt && <img src={priceArt.src} width={priceArt.width} height={priceArt.height} alt="" style={{ marginTop: 22 }} />}
          {subArt && <img src={subArt.src} width={subArt.width} height={subArt.height} alt="" style={{ marginTop: 8 }} />}
          {!ar && price && <div style={{ fontSize: 20, marginTop: 26, color: "#ebdab0", fontWeight: 700, letterSpacing: 1 }}>{price.toUpperCase()}</div>}
          {!ar && <div style={{ fontSize: 14, marginTop: 12, color: "#c3cec6", fontWeight: 400, letterSpacing: 2 }}>{t("og.sub").toUpperCase()}</div>}
        </div>
        {labelArt ? (
          <img src={labelArt.src} width={labelArt.width} height={labelArt.height} alt="" style={{ position: "absolute", [side]: 28, bottom: 20 }} />
        ) : (
          <div style={{ position: "absolute", right: 28, bottom: 24, display: "flex", fontSize: 13, color: "#c3cec6", letterSpacing: 2 }}>{t("og.aiLabel").toUpperCase()}</div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Syncopate", data: bold, weight: 700, style: "normal" },
        { name: "Syncopate", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
