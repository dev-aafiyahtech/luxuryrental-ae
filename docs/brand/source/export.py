"""Build the whole LuxuryRental.ae logo pack and copy it into the repo.

python export.py [--no-repo]
"""
import json, os, re, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import brandkit as bk
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.dirname(HERE)
REPO = "/home/user/luxuryrental-ae"
OUT = os.path.join(ROOT, "out", "pack"); os.makedirs(OUT, exist_ok=True)
TMP = os.path.join(ROOT, "out", "tmp"); os.makedirs(TMP, exist_ok=True)
ENV = dict(os.environ, SVGO_FROM=os.path.join(ROOT, "node", "package.json"))
NODE = lambda *a: subprocess.run(["node", *a], check=True, capture_output=True, text=True, env=ENV).stdout

kit = bk.build(os.path.join(ROOT, "fonts", "Syncopate-Bold.ttf"), OUT)
mono, H, S, M = kit["mono"], kit["H"], kit["S"], kit["M"]
print(NODE(os.path.join(HERE, "opt.mjs"), OUT))


# ---------------------------------------------------------------- raster helpers
def place(art, width, cx, cy, fg=bk.IVORY, ac=bk.GOLD):
    s = width / art.w
    x = cx - width / 2 - art.bbox[0] * s
    y = cy - art.h * s / 2 - art.bbox[1] * s
    return (f'<g transform="translate({x:.3f} {y:.3f}) scale({s:.5f})"><path fill="{fg}" d="{"".join(art.fg)}"/>'
            f'<path fill="{ac}" d="{"".join(art.ac)}"/></g>')


def canvas(w, h, inner, bg=bk.INK, rx=0):
    rect = f'<rect width="{w}" height="{h}" rx="{rx}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{rect}{inner}</svg>'


def text_regular(text, size_cap, track_em, x, y, fill, anchor="middle"):
    """Syncopate Regular outlines (for the OG tagline only)."""
    f = TTFont(os.path.join(ROOT, "fonts", "Syncopate-Regular.ttf")); gs = f.getGlyphSet(); cmap = f.getBestCmap()
    s = size_cap / 1374
    total, pos = 0, []
    for ch in text:
        g = cmap[ord(ch)]
        pos.append((g, total)); total += f["hmtx"][g][0] + track_em * 2048
    total -= track_em * 2048
    x0 = x - total * s / 2 if anchor == "middle" else x
    p = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}")
    for g, off in pos:
        gs[g].draw(TransformPen(p, (s, 0, 0, -s, x0 + off * s, y)))
    return f'<path fill="{fill}" d="{p.getCommands()}"/>'


# mark centred on its bounding box, nudged so the gold square doesn't pull it right
def icon(size, width_frac, rx=0, bg=bk.INK):
    return canvas(size, size, place(M, size * width_frac, size / 2, size / 2), bg=bg, rx=rx)


og = canvas(1200, 630,
            '<defs><radialGradient id="h" cx="600" cy="660" r="560" gradientUnits="userSpaceOnUse">'
            '<stop offset="0" stop-color="#CA8A04" stop-opacity=".22"/><stop offset="1" stop-color="#CA8A04" stop-opacity="0"/>'
            '</radialGradient></defs><rect width="1200" height="630" fill="url(#h)"/>'
            + place(H, 760, 600, 282)
            + '<rect x="560" y="378" width="80" height="2" fill="#CA8A04"/>'
            + text_regular("DELIVERED ACROSS DUBAI", 15, 0.32, 600, 432, "#A8A29E"))

jobs = [
    ("favicon-16.png", bk.favicon16().replace('viewBox="0 0 16 16"', 'viewBox="0 0 16 16" width="16" height="16"'), 16, 16, True),
    ("favicon-32.png", bk.favicon32().replace('viewBox="0 0 32 32"', 'viewBox="0 0 32 32" width="32" height="32"'), 32, 32, True),
    ("apple-touch-icon.png", icon(180, .58), 180, 180, False),
    ("icon-192.png", icon(192, .5), 192, 192, False),
    ("icon-512.png", icon(512, .5), 512, 512, False),
    ("avatar-640.png", icon(640, .48), 640, 640, False),
    ("og-template.png", og, 1200, 630, False),
]
json.dump([{"html": h, "width": w, "height": hh, "out": os.path.join(OUT, n), "transparent": t} for n, h, w, hh, t in jobs],
          open(os.path.join(TMP, "jobs.json"), "w"))
print(NODE(os.path.join(HERE, "raster.mjs"), os.path.join(TMP, "jobs.json")))

# favicon.ico (16 + 32)
ico_js = (f'const p=require("{ROOT}/node/node_modules/png-to-ico");'
          f'p(["{OUT}/favicon-16.png","{OUT}/favicon-32.png"]).then(b=>require("fs").writeFileSync("{OUT}/favicon.ico",b));')
subprocess.run(["node", "-e", ico_js], check=True)

# ---------------------------------------------------------------- Logo.tsx
def optimised_paths(art, name):
    p = os.path.join(TMP, "inline"); os.makedirs(p, exist_ok=True)
    for f in os.listdir(p): os.remove(os.path.join(p, f))
    x0, y0, _, _ = art.bbox
    open(os.path.join(p, name + ".svg"), "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} {art.w:.1f} {art.h:.1f}">'
        f'<path fill="#fafaf9" d="{"".join(art.fg)}"/><path fill="#ca8a04" d="{"".join(art.ac)}"/></svg>')
    NODE(os.path.join(HERE, "opt.mjs"), p)
    s = open(os.path.join(p, name + ".svg")).read()
    vb = re.search(r'viewBox="([^"]+)"', s).group(1)
    ds = re.findall(r'<path[^>]*?fill="([^"]+)"[^>]*?d="([^"]+)"', s) or [(m[1], m[0]) for m in re.findall(r'<path[^>]*?d="([^"]+)"[^>]*?fill="([^"]+)"', s)]
    fg = next(d for c, d in ds if c.lower() in ("#fafaf9",))
    ac = next(d for c, d in ds if c.lower() in ("#ca8a04",))
    return vb, fg, ac


hvb, hfg, hac = optimised_paths(H, "lockup")
mvb, mfg, mac = optimised_paths(M, "mono")
tsx = f'''import clsx from "clsx";

// LuxuryRental.ae logo, direction "Corner". Outlines are Syncopate Bold (SIL OFL 1.1),
// generated by docs/brand/source/brandkit.py: edit the source, not these paths.
// Letters use currentColor; the ".ae" and the monogram's full-stop square use the gold accent.
// Usage rules: docs/brand/logo.md. Files for everything else: public/brand/.

const LOCKUP = {{
  viewBox: "{hvb}",
  letters: "{hfg}",
  accent: "{hac}",
}};

const MONOGRAM = {{
  viewBox: "{mvb}",
  letters: "{mfg}",
  accent: "{mac}",
}};

// Header and footer sizes: about 206 px wide on small phones (wordmark cap height ~8.5 px,
// like the prototype's 12 px text logo), larger from 400 px, held back at lg so the
// desktop nav fits. max-w-full lets it shrink inside narrow footer columns.
const LOCKUP_SIZE = "w-[206px] min-[400px]:w-[236px] sm:w-[280px] lg:w-[236px] xl:w-[290px]";
const MONOGRAM_SIZE = "w-9";

export function Logo({{ className, compact = false }}: {{ className?: string; compact?: boolean }}) {{
  const art = compact ? MONOGRAM : LOCKUP;
  return (
    <svg
      viewBox={{art.viewBox}}
      role="img"
      aria-label="LuxuryRental.ae"
      preserveAspectRatio="xMinYMid meet"
      className={{clsx("block h-auto max-w-full text-fg", className ?? (compact ? MONOGRAM_SIZE : LOCKUP_SIZE))}}
    >
      <path fill="currentColor" d={{art.letters}} />
      <path fill="var(--color-accent, #CA8A04)" d={{art.accent}} />
    </svg>
  );
}}
'''
open(os.path.join(OUT, "Logo.tsx"), "w").write(tsx)

for f in sorted(os.listdir(OUT)):
    print(f"{f:32} {os.path.getsize(os.path.join(OUT, f)):>8}")

if "--no-repo" not in sys.argv:
    dst = os.path.join(REPO, "public", "brand"); os.makedirs(dst, exist_ok=True)
    for f in os.listdir(OUT):
        if f in ("Logo.tsx", "favicon-16.png", "favicon-32.png"):
            continue
        shutil.copy(os.path.join(OUT, f), os.path.join(dst, f))
    shutil.copy(os.path.join(OUT, "Logo.tsx"), os.path.join(REPO, "src", "components", "brand", "Logo.tsx"))
    shutil.copy(os.path.join(OUT, "favicon.svg"), os.path.join(REPO, "src", "app", "[lang]", "icon.svg"))
    shutil.copy(os.path.join(OUT, "apple-touch-icon.png"), os.path.join(REPO, "src", "app", "[lang]", "apple-icon.png"))
    src = os.path.join(REPO, "docs", "brand", "source"); os.makedirs(src, exist_ok=True)
    for f in ("brandkit.py", "opt.mjs"):
        shutil.copy(os.path.join(HERE, f), os.path.join(src, f))
    print("copied to repo")
