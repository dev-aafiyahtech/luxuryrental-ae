// One-pass visual check: desktop chapters, mobile chapters, reduced motion, console errors.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const SCR = '/tmp/claude-0/-home-claude/ae2313d9-2807-5512-9a3c-69afd2e6a821/scratchpad';
const LIB = `${SCR}/libs/node_modules`;
const OUT = `${SCR}/test/shots`;
fs.mkdirSync(OUT, { recursive: true });
const page_src = fs.readFileSync('/home/claude/prototype/luxuryrental-prototype.html', 'utf8');
const skeleton = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>${page_src}</body></html>`;
const fontCSS = `
@font-face{font-family:'Syncopate';font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/syn400.woff2) format('woff2')}
@font-face{font-family:'Syncopate';font-weight:700;font-display:swap;src:url(https://fonts.gstatic.com/syn700.woff2) format('woff2')}
@font-face{font-family:'Montserrat';font-weight:300 700;font-display:swap;src:url(https://fonts.gstatic.com/mont.woff2) format('woff2')}`;
const MAP = {
  'three.min.js': `${LIB}/three/build/three.min.js`,
  'gsap.min.js': `${LIB}/gsap/dist/gsap.min.js`,
  'ScrollTrigger.min.js': `${LIB}/gsap/dist/ScrollTrigger.min.js`,
  'lenis.min.js': `${LIB}/lenis/dist/lenis.min.js`,
  'syn400.woff2': `${LIB}/@fontsource/syncopate/files/syncopate-latin-400-normal.woff2`,
  'syn700.woff2': `${LIB}/@fontsource/syncopate/files/syncopate-latin-700-normal.woff2`,
  'mont.woff2': `${LIB}/@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2`,
};
const blocked = [];
async function route(page) {
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith('http://proto.local/')) return r.fulfill({ contentType: 'text/html', body: skeleton });
    if (u.includes('fonts.googleapis.com/css2')) return r.fulfill({ contentType: 'text/css', body: fontCSS });
    const key = Object.keys(MAP).find(k => u.endsWith(k));
    if (key) return r.fulfill({ path: MAP[key], contentType: key.endsWith('.js') ? 'application/javascript' : 'font/woff2' });
    blocked.push(u); return r.abort();
  });
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const logs = [];
async function session(name, ctxOpts, shots) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`[${name}] ${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => logs.push(`[${name}] pageerror: ${e.message}`));
  await route(page);
  await page.goto('http://proto.local/index.html');
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => ({
    gl: !document.documentElement.classList.contains('no-gl'),
    rm: document.documentElement.classList.contains('rm'),
    lenis: document.documentElement.classList.contains('lenis'),
    scrollW: document.documentElement.scrollWidth, vw: innerWidth,
    sections: ['skyline', 'fleet', 'sculpture', 'reserve'].map(id => { const e = document.getElementById(id); return [id, e.offsetTop, e.offsetHeight]; }),
    vh: innerHeight, docH: document.documentElement.scrollHeight,
  }));
  logs.push(`[${name}] ${JSON.stringify(info)}`);
  for (const s of shots) {
    if (s.before) await s.before(page);
    const y = await page.evaluate(s.y);
    await page.evaluate(yy => window.scrollTo(0, yy), y);
    await page.waitForTimeout(s.wait ?? 2200);
    if (s.after) await s.after(page);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (ov) logs.push(`[${name}] horizontal overflow at ${s.id}`);
    await page.screenshot({ path: `${OUT}/${s.id}.png` });
  }
  await ctx.close();
}
// Chapter progress targets: c1 uses skyline top→bottom-vh; c2..c4 use (top-vh)→(bottom-vh)
const at = (id, p) => new Function(`const e=document.getElementById('${id}'); const vh=innerHeight; const t=e.offsetTop, h=e.offsetHeight;
  return '${id}'==='skyline' ? t + ${p}*(h-vh) : (t-vh) + ${p}*h;`);

await session('desktop', { viewport: { width: 1440, height: 900 } }, [
  { id: 'd1-hero', y: () => 0 },
  { id: 'd2-descent', y: at('skyline', 0.5) },
  { id: 'd3-rooftop', y: at('skyline', 0.97) },
  { id: 'd4-tunnel', y: at('fleet', 0.55) },
  { id: 'd5-sculpture', y: at('sculpture', 0.72) },
  { id: 'd6-headlights', y: at('reserve', 0.5) },
  { id: 'd7-reserve', y: at('reserve', 1.0) },
]);
await session('mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, [
  { id: 'm1-hero', y: () => 0 },
  { id: 'm2-sculpture', y: at('sculpture', 0.72) },
  { id: 'm3-reserve', y: at('reserve', 1.0) },
  { id: 'm4-dock-open', y: () => 0, wait: 1500, after: async p => { await p.click('#dockToggle'); await p.waitForTimeout(400); } },
]);
await session('reduced', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, [
  { id: 'r1-sculpture', y: () => document.getElementById('sculpture').offsetTop + 40, wait: 1200 },
]);
await browser.close();
fs.writeFileSync(`${OUT}/log.txt`, logs.join('\n') + '\n\nBlocked: ' + [...new Set(blocked)].join(', '));
console.log(logs.join('\n'));
console.log('Blocked:', [...new Set(blocked)]);
