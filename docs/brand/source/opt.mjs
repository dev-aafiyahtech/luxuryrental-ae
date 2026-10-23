// Optimise SVGs in place with SVGO (keeps viewBox, <title>, role).
// Usage: node opt.mjs <dir>
import { createRequire } from "node:module";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// SVGO 3 resolves from this file, or from SVGO_FROM (path to a package.json that depends on svgo).
const require = createRequire(process.env.SVGO_FROM || import.meta.url);
const { optimize } = require("svgo");
const dir = process.argv[2];
for (const f of readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  const p = join(dir, f);
  const before = readFileSync(p, "utf8");
  const { data } = optimize(before, {
    multipass: true,
    floatPrecision: 1,
    plugins: [
      { name: "preset-default", params: { overrides: { removeViewBox: false, removeTitle: false, removeUnknownsAndDefaults: { keepRoleAttr: true } } } },
    ],
  });
  writeFileSync(p, data);
  console.log(f.padEnd(32), before.length, "->", data.length);
}
