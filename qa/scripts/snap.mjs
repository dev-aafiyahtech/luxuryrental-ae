// Screenshot a page of the running dev server and report console errors.
// Usage: node qa/scripts/snap.mjs <path-or-url> <out.png> [desktop|mobile|reduced] [full] [scrollY]
// Example: node qa/scripts/snap.mjs /cars /tmp/cars.png mobile full
import { chromium } from "playwright";

const [, , target = "/", out = "snap.png", mode = "desktop", full = "", scrollY = "0"] = process.argv;
const url = target.startsWith("http") ? target : `http://localhost:3000${target}`;
const viewport = mode === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 };

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: 1,
  isMobile: mode === "mobile",
  hasTouch: mode === "mobile",
  reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
});
const page = await context.newPage();
const problems = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") problems.push(`[console.${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => problems.push(`[pageerror] ${e.message}`));
const res = await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(1200);
if (Number(scrollY)) {
  await page.evaluate((y) => window.scrollTo(0, y), Number(scrollY));
  await page.waitForTimeout(1500);
}
await page.screenshot({ path: out, fullPage: full === "full" });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log(JSON.stringify({ url, status: res?.status(), out, horizontalOverflowPx: overflow, problems }, null, 1));
await browser.close();
