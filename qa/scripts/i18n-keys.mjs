// Checks that every locale's message files have exactly the same keys as English,
// and that {placeholders} match. Usage: node qa/scripts/i18n-keys.mjs
import { readdirSync, readFileSync } from "node:fs";
const base = "src/messages";
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, `${p}${k}.`) : [[`${p}${k}`, String(v)]]));
const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
let problems = 0;
for (const locale of readdirSync(base).filter((l) => l !== "en")) {
  for (const file of readdirSync(`${base}/en`)) {
    const en = new Map(flat(JSON.parse(readFileSync(`${base}/en/${file}`, "utf8"))));
    let other;
    try { other = new Map(flat(JSON.parse(readFileSync(`${base}/${locale}/${file}`, "utf8")))); } catch { console.log(`${locale}/${file}: missing or invalid`); problems++; continue; }
    for (const k of en.keys()) if (!other.has(k)) { console.log(`${locale}/${file}: missing ${k}`); problems++; }
    for (const k of other.keys()) if (!en.has(k)) { console.log(`${locale}/${file}: extra ${k}`); problems++; }
    for (const [k, v] of en) if (other.has(k) && vars(v) !== vars(other.get(k))) { console.log(`${locale}/${file}: placeholders differ at ${k}`); problems++; }
    const same = [...en].filter(([k, v]) => other.get(k) === v && /[a-z]{3}/i.test(v)).length;
    if (same) console.log(`${locale}/${file}: ${same} strings identical to English (untranslated?)`);
  }
}
console.log(problems ? `${problems} problem(s)` : "Keys and placeholders match.");
process.exit(problems ? 1 : 0);
