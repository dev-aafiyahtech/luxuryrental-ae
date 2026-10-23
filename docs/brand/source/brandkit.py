#!/usr/bin/env python3
"""LuxuryRental.ae logo kit: editable source.

Builds every vector variant of the logo from Syncopate Bold (SIL OFL 1.1) outlines.
All geometry is in font units (FU: 2048 em, cap height 1374, y-up, baseline 0) until
export, where it is scaled to "logo units" (cap height = 100, y-down).

Usage:  python brandkit.py <Syncopate-Bold.ttf> <out-dir>
Needs:  fontTools.  Optional: run SVGO over the output (see opt.mjs).
"""
import json
import os
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

GOLD = "#EBDAB0"      # Antique Gold: accent (MASTER.md §3)
GOLD_HI = "#F6EBCF"   # accent hover, metallic highlight only
IVORY = "#F4EADE"     # Alabaster: foreground
INK = "#2C5252"       # Sea Moss: background
TITLE = "LuxuryRental.ae"

CAP = 1374
U = 100 / CAP  # FU -> logo units (cap height = 100)

_FONT = None


def load_font(path):
    global _FONT, GS, CMAP
    _FONT = TTFont(path)
    GS = _FONT.getGlyphSet()
    CMAP = _FONT.getBestCmap()


def rec(ch):
    r = RecordingPen()
    GS[CMAP[ord(ch)]].draw(r)
    return r.value


def adv(ch):
    return _FONT["hmtx"][CMAP[ord(ch)]][0]


def moved(value, dx=0.0, dy=0.0, sx=1.0, sy=1.0):
    return [(op, tuple((p[0] * sx + dx, p[1] * sy + dy) for p in pts)) for op, pts in value]


def box(x0, y0, x1, y1):
    return [("moveTo", ((x0, y0),)), ("lineTo", ((x0, y1),)), ("lineTo", ((x1, y1),)),
            ("lineTo", ((x1, y0),)), ("closePath", ())]


def rec_bounds(values):
    b = BoundsPen(None)
    for v in values:
        for op, pts in v:
            getattr(b, op)(*pts)
    return b.bounds


def _num(v, nd):
    s = f"{v:.{nd}f}".rstrip("0").rstrip(".")
    return "0" if s in ("", "-0") else s


def to_d(values, s, ox, oy, nd=1):
    """FU recordings -> SVG path data. (ox, oy) is where FU (0, 0) lands; y flips."""
    p = SVGPathPen(None, ntos=lambda v: _num(v, nd))
    tp = TransformPen(p, (s, 0, 0, -s, ox, oy))
    for v in values:
        for op, pts in v:
            getattr(tp, op)(*pts)
    return p.getCommands()


def finish(mark):
    mark["bbox"] = rec_bounds(mark["fg"] + mark["ac"])
    return mark


# --------------------------------------------------------------------------- wordmark
# Syncopate Bold capitals + unicase ".ae" in gold. The full stop is part of the accent,
# so ".ae" reads as the domain and echoes the gold square in the monogram.
TRACK = 190          # FU, ~0.09 em: Syncopate is already very wide
SPACE = 610          # FU, word space between LUXURY and RENTAL
KERN = {
    "LU": -70, "UX": -10, "XU": -10, "UR": -20, "RY": -110,
    "RE": -20, "EN": -30, "NT": -60, "TA": -170, "AL": -30,
    "L.": -150, ".a": -95, "ae": -45,
}


def set_runs(runs):
    out = {"fg": [], "ac": []}
    seq = [(ch, key) for text, key in runs for ch in text]
    x = 0
    for i, (ch, key) in enumerate(seq):
        if ch == " ":
            x += SPACE
            continue
        out[key].append(moved(rec(ch), dx=x))
        x += adv(ch)
        if i + 1 < len(seq) and seq[i + 1][0] != " ":
            x += TRACK + KERN.get(ch + seq[i + 1][0], 0)
    return finish(out)


def wordmark():
    return set_runs([("LUXURY RENTAL", "fg"), (".ae", "ac")])


def wordmark_lines():
    return set_runs([("LUXURY", "fg")]), set_runs([("RENTAL", "fg"), (".ae", "ac")])


# --------------------------------------------------------------------------- monogram
# "Corner" monogram: an L (stem + foot) holds a scaled Syncopate Bold R in its corner.
# The foot stops short and a gold square closes the corner: L R full stop, "LR.".
# Stroke weights of the L match the scaled R (stem 371k, foot 301k, like Syncopate's L).
def monogram(gap=120, H=CAP):
    k = (H - gap) / (CAP + 301)          # R scale so foot + gap + R = H
    stem, foot = 371 * k, 301 * k
    R = moved(rec("R"), dx=-215 * k, sx=k, sy=k)       # R ink starts at x=0
    rx, ry = stem + gap, foot + gap
    W = rx + (1841 - 215) * k                            # right edge of R leg = W
    dot = foot
    return finish({
        "fg": [box(0, 0, stem, H), box(0, 0, W - dot - gap, foot), moved(R, dx=rx, dy=ry)],
        "ac": [box(W - dot, 0, W, dot)],
        "k": k, "stem": stem, "foot": foot, "gap": gap, "W": W, "H": H,
    })


def monogram_fullstop(gap=150, dot_gap=120):
    """Alternative B ("Full stop"): L and R side by side + gold square period."""
    L = moved(rec("L"), dx=-215)
    rdx = 1589 - 215 + gap - 215
    R = moved(rec("R"), dx=rdx)
    end = rdx + 1841
    return finish({"fg": [L, R], "ac": [box(end + dot_gap, 0, end + dot_gap + 301, 301)]})


# --------------------------------------------------------------------------- composition
class Art:
    """A composed artwork in logo units (cap = 100, y-down)."""

    def __init__(self):
        self.fg, self.ac, self.bbox = [], [], None

    def add(self, mark, scale, x, base):
        s = U * scale
        x0 = mark["bbox"][0]
        if mark["fg"]:
            self.fg.append(to_d(mark["fg"], s, x - x0 * s, base))
        if mark["ac"]:
            self.ac.append(to_d(mark["ac"], s, x - x0 * s, base))
        bx0, by0, bx1, by1 = mark["bbox"]
        self._grow((x, base - by1 * s, x + (bx1 - bx0) * s, base - by0 * s))

    def add_rect(self, key, x, y, w, h):
        getattr(self, key).append(f"M{_num(x,1)} {_num(y,1)}h{_num(w,1)}v{_num(h,1)}h{_num(-w,1)}z")
        self._grow((x, y, x + w, y + h))

    def _grow(self, b):
        if self.bbox is None:
            self.bbox = b
        else:
            a = self.bbox
            self.bbox = (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))

    @property
    def w(self):
        return self.bbox[2] - self.bbox[0]

    @property
    def h(self):
        return self.bbox[3] - self.bbox[1]


def mwidth(mark, scale=1.0):
    return (mark["bbox"][2] - mark["bbox"][0]) * U * scale


MONO_IN_LOCKUP = 2.0   # monogram height = 2 x wordmark cap height
LOCKUP_GAP = 80        # monogram to wordmark, logo units (0.8 cap)


def art_horizontal(mono, wm):
    a = Art()
    M = 100 * MONO_IN_LOCKUP
    a.add(mono, MONO_IN_LOCKUP, 0, M)
    a.add(wm, 1, mwidth(mono, MONO_IN_LOCKUP) + LOCKUP_GAP, M / 2 + 50)
    return a


STACK_MONO = 3.0
STACK_LINE_GAP = 56
STACK_MONO_GAP = 110


def art_stacked(mono, top, bot):
    a = Art()
    M = 100 * STACK_MONO
    W = max(mwidth(top), mwidth(bot), mwidth(mono, STACK_MONO))
    a.add(mono, STACK_MONO, (W - mwidth(mono, STACK_MONO)) / 2, M)
    y = M + STACK_MONO_GAP + 100
    a.add(top, 1, (W - mwidth(top)) / 2, y)
    a.add(bot, 1, (W - mwidth(bot)) / 2, y + 100 + STACK_LINE_GAP)
    return a


def art_single(mark, scale=1.0):
    a = Art()
    a.add(mark, scale, 0, 100 * scale)
    return a


# --------------------------------------------------------------------------- 16 px cut
# Hand-fitted to a 16 x 16 pixel grid: whole-pixel stems and gaps, R bowl drawn with
# 45-degree chamfers so it stays crisp in a browser tab. Used for favicon.svg and the
# 16 px layer of favicon.ico (the 32 px layer uses the full monogram).
def favicon16(tile=True, fg=IVORY, ac=GOLD, bg=INK):
    fgd = (
        "M2 2h2v10h7v2H2z"                                   # L: stem + foot
        "M5 2h7l2 2v2l-1.4 1.4L14 11h-2.5l-2-3H7v3H5z"       # R outline
        "M7 4v2h4.5V4z"                                      # R counter
    )
    acd = "M12 12h2v2h-2z"
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><title>{TITLE}</title>']
    if tile:
        parts.append(f'<rect width="16" height="16" rx="3" fill="{bg}"/>')
    parts.append(f'<path fill="{fg}" fill-rule="evenodd" d="{fgd}"/><path fill="{ac}" d="{acd}"/></svg>')
    return "".join(parts)


def favicon32(fg=IVORY, ac=GOLD, bg=INK):
    """32 px layer of favicon.ico: the real monogram, pixel-fitted (stem 4, gaps 2, foot 4)."""
    stem, gap, foot, rh = 4, 2, 4, 16

    def pl(v, pts):  # piecewise-linear map that lands the R's stems and bars on whole pixels
        for (a0, b0), (a1, b1) in zip(pts, pts[1:]):
            if v <= a1 or (a1, b1) == pts[-1]:
                return b0 + (v - a0) * (b1 - b0) / (a1 - a0)
    XS = [(215, 0), (586, 4), (1319, 13), (1694, 17), (1841, 19)]
    YS = [(0, 0), (506, 6), (793, 9), (1087, 13), (1374, rh)]
    R = [(op, tuple((pl(x, XS), pl(y, YS)) for x, y in pts)) for op, pts in rec("R")]
    x0, top = 4, 5                       # mark origin (left, top) in the 32 grid
    H = foot + gap + rh                  # 22
    W = stem + gap + 19                  # 25
    m = {"fg": [box(0, 0, stem, H), box(0, 0, W - foot - gap, foot), moved(R, dx=stem + gap, dy=foot + gap)],
         "ac": [box(W - foot, 0, W, foot)]}
    d_fg = to_d(m["fg"], 1, x0, top + H, nd=2)
    d_ac = to_d(m["ac"], 1, x0, top + H, nd=2)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><title>{TITLE}</title>'
            f'<rect width="32" height="32" rx="6" fill="{bg}"/><path fill="{fg}" d="{d_fg}"/><path fill="{ac}" d="{d_ac}"/></svg>')


def metallic(art, pad=50):
    """Extra only (never the primary): brushed antique-gold gradient on Sea Moss."""
    x0, y0, _, _ = art.bbox
    vb = [x0 - pad, y0 - pad, art.w + 2 * pad, art.h + 2 * pad]
    vbs = " ".join(_num(v, 1) for v in vb)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vbs}" role="img"><title>{TITLE}</title>'
            f'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="#F8F0DC"/><stop offset=".38" stop-color="{GOLD_HI}"/>'
            f'<stop offset=".52" stop-color="#9C8455"/><stop offset=".64" stop-color="{GOLD}"/>'
            f'<stop offset="1" stop-color="#F2E2BC"/></linearGradient></defs>'
            f'<rect x="{_num(vb[0],1)}" y="{_num(vb[1],1)}" width="{_num(vb[2],1)}" height="{_num(vb[3],1)}" fill="{INK}"/>'
            f'<path fill="url(#g)" d="{"".join(art.fg + art.ac)}"/></svg>')


# --------------------------------------------------------------------------- export
SCHEMES = {
    "primary": (IVORY, GOLD, INK),
    "white": (IVORY, IVORY, None),
    "moss": (INK, INK, None),
    "gold": (GOLD, GOLD, None),
}


def svg(art, scheme="primary", pad=0.0, bg=None, title=TITLE):
    fg, ac, scheme_bg = SCHEMES[scheme]
    bg = bg if bg is not None else scheme_bg
    x0, y0, _, _ = art.bbox
    vb = [x0 - pad, y0 - pad, art.w + 2 * pad, art.h + 2 * pad]
    vbs = " ".join(_num(v, 1) for v in vb)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vbs}" role="img"><title>{title}</title>']
    if bg:
        out.append(f'<rect x="{_num(vb[0],1)}" y="{_num(vb[1],1)}" width="{_num(vb[2],1)}" height="{_num(vb[3],1)}" fill="{bg}"/>')
    if fg == ac:
        out.append(f'<path fill="{fg}" d="{"".join(art.fg + art.ac)}"/>')
    else:
        out.append(f'<path fill="{fg}" d="{"".join(art.fg)}"/><path fill="{ac}" d="{"".join(art.ac)}"/>')
    out.append("</svg>")
    return "".join(out)


def build(font_path, out_dir):
    load_font(font_path)
    os.makedirs(out_dir, exist_ok=True)
    mono = monogram()
    wm = wordmark()
    top, bot = wordmark_lines()
    H = art_horizontal(mono, wm)
    S = art_stacked(mono, top, bot)
    W = art_single(wm)
    M = art_single(mono)
    files = {
        # primary: Alabaster letters, Antique Gold accent, on Sea Moss with the clear space built in
        "logo-horizontal.svg": svg(H, "primary", pad=100),
        "logo-stacked.svg": svg(S, "primary", pad=150),
        "wordmark.svg": svg(W, "primary", pad=100),
        "monogram.svg": svg(M, "primary", pad=50),
    }
    for c in ("white", "moss", "gold"):
        files[f"logo-horizontal-{c}.svg"] = svg(H, c)
        files[f"monogram-{c}.svg"] = svg(M, c)
    files["favicon.svg"] = favicon16()
    files["monogram-metallic.svg"] = metallic(M)
    for name, s in files.items():
        with open(os.path.join(out_dir, name), "w") as f:
            f.write(s)
    return {"mono": mono, "wm": wm, "H": H, "S": S, "W": W, "M": M}


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
