import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { cars, getCarByPath } from "@/content/cars";
import { carMedia } from "@/content/car-media";
import { getBrand } from "@/content/brands";
import { formatAED } from "@/lib/format";

// Share card for each car page (WhatsApp, iMessage, social): the car's AI image, its name and
// launch rate, the wordmark and the "Illustrative AI image" label. Generated at build time.
// Colours are the palette tokens written out, because the image renderer has no CSS variables.

export const alt = "A car available to rent in Dubai from LuxuryRental.ae";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return cars.map((c) => ({ brand: c.brand, model: c.modelSlug }));
}

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Syncopate-Bold.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Syncopate-Regular.ttf")),
]);
const logo = readFile(join(process.cwd(), "public/brand/logo-horizontal-white.svg"), "base64").then((b) => `data:image/svg+xml;base64,${b}`);

/** The 4:3 card image (whole car, studio continued above and below) as a JPEG data URL: the renderer doesn't read WebP. */
async function cardSrc(path?: string): Promise<string | null> {
  if (!path) return null;
  const jpg = await sharp(join(process.cwd(), "public", path)).resize(840, 630, { fit: "cover" }).jpeg({ quality: 84 }).toBuffer();
  return `data:image/jpeg;base64,${jpg.toString("base64")}`;
}

export default async function Image({ params }: { params: Promise<{ brand: string; model: string }> }) {
  const { brand, model } = await params;
  const car = getCarByPath(brand, model);
  const [[bold, regular], logoSrc, hero] = await Promise.all([fonts, logo, cardSrc(car ? carMedia[car.slug]?.card : undefined)]);
  const name = car?.model ?? "LuxuryRental.ae";
  const make = car ? getBrand(car.brand)?.name ?? "" : "";
  const price = car ? `${car.rates.onRequest ? "On request · from " : "From "}${formatAED(car.rates.daily)} / day`.toUpperCase() : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#1d3c3c", color: "#f4eade", fontFamily: "Syncopate" }}>
        {hero && <img src={hero} width={840} height={630} alt="" style={{ position: "absolute", top: 0, right: 0, width: 840, height: 630 }} />}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 360, width: 220, display: "flex", background: "linear-gradient(90deg, #1d3c3c 0%, rgba(29,60,60,0) 100%)" }} />
        <div style={{ position: "absolute", top: 52, left: 60, display: "flex" }}>
          <img src={logoSrc} width={330} height={28} alt="" />
        </div>
        <div style={{ position: "absolute", left: 60, bottom: 64, display: "flex", flexDirection: "column", maxWidth: 420 }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: "#ebdab0", fontWeight: 400 }}>{make.toUpperCase()}</div>
          <div style={{ fontSize: name.length > 12 ? 40 : 54, fontWeight: 700, lineHeight: 1.1, marginTop: 12, textTransform: "uppercase" }}>{name}</div>
          {price && <div style={{ fontSize: 20, marginTop: 26, color: "#ebdab0", fontWeight: 700, letterSpacing: 1 }}>{price}</div>}
          <div style={{ fontSize: 14, marginTop: 12, color: "#c3cec6", fontWeight: 400, letterSpacing: 2 }}>INCL. VAT · DELIVERED ACROSS DUBAI</div>
        </div>
        <div style={{ position: "absolute", right: 28, bottom: 24, display: "flex", fontSize: 13, color: "#c3cec6", letterSpacing: 2 }}>ILLUSTRATIVE AI IMAGE</div>
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
