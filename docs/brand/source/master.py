"""Master artboard: every vector variant on one canvas, as named groups (for Figma/Illustrator)."""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import brandkit as bk
ROOT = os.path.dirname(HERE)
bk.load_font(os.path.join(ROOT, "fonts", "Syncopate-Bold.ttf"))
mono = bk.monogram(); wm = bk.wordmark(); top, bot = bk.wordmark_lines()
H = bk.art_horizontal(mono, wm); S = bk.art_stacked(mono, top, bot); W = bk.art_single(wm); M = bk.art_single(mono)


def grp(gid, art, x, y, fg, ac, bg=None, pad=0):
    out = [f'<g id="{gid}" transform="translate({x} {y})">']
    if bg:
        out.append(f'<rect x="{-pad}" y="{-pad}" width="{art.w + 2*pad:.1f}" height="{art.h + 2*pad:.1f}" fill="{bg}"/>')
    out.append(f'<g transform="translate({-art.bbox[0]:.1f} {-art.bbox[1]:.1f})"><path fill="{fg}" d="{"".join(art.fg)}"/>'
               f'<path fill="{ac}" d="{"".join(art.ac)}"/></g></g>')
    return "".join(out)


fav = re.sub(r"^<svg[^>]*>|<title>.*?</title>|</svg>$", "", bk.favicon16())
fav32 = re.sub(r"^<svg[^>]*>|<title>.*?</title>|</svg>$", "", bk.favicon32())
body = [
    grp("logo-horizontal_primary", H, 200, 200, bk.IVORY, bk.GOLD, bk.INK, 100),
    grp("logo-stacked_primary", S, 3100, 200, bk.IVORY, bk.GOLD, bk.INK, 150),
    grp("wordmark_primary", W, 200, 650, bk.IVORY, bk.GOLD, bk.INK, 100),
    grp("monogram_primary", M, 200, 1000, bk.IVORY, bk.GOLD, bk.INK, 50),
    grp("logo-horizontal_white", H, 200, 1300, bk.IVORY, bk.IVORY),
    grp("logo-horizontal_gold", H, 200, 1650, bk.GOLD, bk.GOLD),
    f'<rect x="100" y="1900" width="2600" height="400" fill="{bk.IVORY}"/>',
    grp("logo-horizontal_black", H, 200, 2000, bk.INK, bk.INK),
    f'<g id="favicon-16-cut" transform="translate(3100 1300) scale(20)">{fav}</g>',
    f'<g id="favicon-32-cut" transform="translate(3600 1300) scale(10)">{fav32}</g>',
]
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4600 2500"><title>LuxuryRental.ae logo master</title>'
       f'<rect width="4600" height="2500" fill="#1C1917"/>{"".join(body)}</svg>')
out = sys.argv[1]
open(out, "w").write(svg)
print(out, len(svg))
