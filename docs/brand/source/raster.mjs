// Rasterise jobs with the repo's Playwright Chromium.
// Usage: node raster.mjs jobs.json   (jobs: [{html, width, height, out, transparent?, scale?}])
import { chromium } from "/home/user/luxuryrental-ae/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
const jobs = JSON.parse(readFileSync(process.argv[2], "utf8"));
const browser = await chromium.launch();
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: j.width, height: j.height }, deviceScaleFactor: j.scale || 1 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:${j.width}px;height:${j.height}px;overflow:hidden;background:${j.transparent ? "transparent" : (j.bg || "#0C0A09")}}svg{display:block}</style></head><body>${j.html}</body></html>`);
  await page.waitForTimeout(50);
  await page.screenshot({ path: j.out, omitBackground: !!j.transparent, clip: { x: 0, y: 0, width: j.width, height: j.height } });
  await page.close();
  console.log("wrote", j.out);
}
await browser.close();
