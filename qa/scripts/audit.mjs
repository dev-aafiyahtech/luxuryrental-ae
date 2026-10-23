// Quick audit of every demo route at phone and desktop widths: HTTP status, console
// errors, horizontal overflow, H1 count. Needs the dev server on :3000.
// Usage: node qa/scripts/audit.mjs
import { chromium } from "playwright";

const routes = [
  "/", "/cars", "/cars/lamborghini", "/cars/lamborghini/revuelto", "/cars/bugatti/chiron-super-sport", "/cars/rolls-royce/phantom",
  "/cars/type/supercars", "/cars/type/hypercars", "/chauffeur", "/delivery", "/delivery/dubai-airport-dxb", "/delivery/dubai-silicon-oasis",
  "/pricing", "/requirements", "/about", "/faq", "/contact", "/legal/terms-of-rental", "/legal/cancellation", "/legal/privacy",
  "/legal/cookies", "/legal/terms-of-use", "/legal/accessibility", "/book/trip?car=ferrari-296-gts", "/book/extras", "/book/driver",
  "/book/review", "/book/confirmed", "/booking", "/pay", "/demo/ops", "/no-such-page",
];
const sizes = [{ name: "390", width: 390, height: 844, mobile: true }, { name: "1440", width: 1440, height: 900, mobile: false }];

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let failures = 0;
for (const size of sizes) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, isMobile: size.mobile, hasTouch: size.mobile });
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
    const res = await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - window.innerWidth, h1: document.querySelectorAll("h1").length }));
    const expected404 = route === "/no-such-page";
    if (expected404) errors.splice(0, errors.length, ...errors.filter((e) => !e.includes("404")));
    const bad = errors.length || info.overflow > 0 || info.h1 !== 1 || (!expected404 && res?.status() !== 200);
    if (bad) failures++;
    console.log(`${bad ? "FAIL" : "ok  "} ${size.name} ${route} status=${res?.status()} h1=${info.h1} overflow=${info.overflow}${errors.length ? ` errors=${JSON.stringify(errors)}` : ""}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
console.log(failures ? `${failures} problem(s)` : "All routes clean.");
process.exit(failures ? 1 : 0);
