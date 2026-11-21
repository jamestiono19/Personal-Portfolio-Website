"""The castle gatehouse for the loading screen, in four pieces:

  gate-wall.svg    stone gatehouse face with an open arch (transparent)
  gate-door-l.svg  left door leaf, hinge on its outer (left) edge
  gate-door-r.svg  right door leaf, hinge on its outer (right) edge
  gate-light.svg   what shows through the gap: warm daylight

The portcullis and the torch flames are drawn in the page itself, so
they can move. Canvas 2400 x 1350; the arch spans x 760..1640.

Usage: python tools/paint/gate.py OUT_DIR
"""

import math
import os
import sys

from common import Painter, mix, jitter, pts

W, H = 2400, 1350
AX0, AX1 = 760, 1640          # arch opening
SPRING = 600                  # springline of the arch
R = (AX1 - AX0) / 2
CX = (AX0 + AX1) / 2

STONE = ["#5b544b", "#4f4941", "#645b50", "#575047", "#6b6155", "#4a443c"]
MORTAR = "#2a2622"


def arch_path(inset=0.0, steps=48):
    out = [(AX0 + inset, H)]
    for k in range(steps + 1):
        a = math.pi - k * math.pi / steps
        out.append((CX + (R - inset) * math.cos(a), SPRING - (R - inset) * math.sin(a)))
    out.append((AX1 - inset, H))
    return out


def wall():
    p = Painter(71)
    rng = p.rng
    p.raw('<rect width="%d" height="%d" fill="%s"/>' % (W, H, MORTAR))
    # Ashlar courses, each row its own height, blocks of random length
    y = 0
    while y < H:
        ch = rng.uniform(70, 110)
        x = -rng.uniform(0, 120)
        while x < W:
            bw = rng.uniform(140, 300)
            q = [(x + 4, y + 4), (x + bw - 4, y + 3 + rng.uniform(-2, 2)), (x + bw - 3, y + ch - 4), (x + 3, y + ch - 3 + rng.uniform(-2, 2))]
            c = rng.choice(STONE)
            # torchlight warms the stones near the two sconces
            for tx in (520, 1880):
                d = math.hypot((x + bw / 2) - tx, (y + ch / 2) - 640)
                if d < 520:
                    c = mix(c, "#b8763a", 0.42 * (1 - d / 520))
            p.fill(q, c, strokes=26, spread=10, angle=0, width=(4, 12), opacity=0.4)
            # chipped top edge highlight
            p.line((x + 8, y + 7), (x + bw - 10, y + 7), mix(c, "#cbb89a", 0.35), 3, 0.5)
            x += bw
        y += ch
    # Voussoirs: wedge stones around the arch
    n = 17
    for k in range(n):
        a0 = math.pi - k * math.pi / n
        a1 = math.pi - (k + 1) * math.pi / n
        r0, r1 = R - 6, R + 150
        q = [(CX + r0 * math.cos(a0), SPRING - r0 * math.sin(a0)), (CX + r1 * math.cos(a0), SPRING - r1 * math.sin(a0)),
             (CX + r1 * math.cos(a1), SPRING - r1 * math.sin(a1)), (CX + r0 * math.cos(a1), SPRING - r0 * math.sin(a1))]
        shrink = 5
        cxq = sum(v[0] for v in q) / 4
        cyq = sum(v[1] for v in q) / 4
        q = [(v[0] + (cxq - v[0]) * shrink / 80, v[1] + (cyq - v[1]) * shrink / 80) for v in q]
        col = "#6e6458" if k != n // 2 else "#7a6f60"
        p.fill(q, col, strokes=20, spread=10, angle=a0, width=(4, 10), opacity=0.4)
    # Jambs
    for side in (0, 1):
        x0 = AX0 - 150 if side == 0 else AX1 + 6
        y = SPRING
        while y < H:
            hh = rng.uniform(90, 120)
            q = [(x0 + 4, y + 4), (x0 + 144, y + 4), (x0 + 144, y + hh - 4), (x0 + 4, y + hh - 4)]
            p.fill(q, "#665d52", strokes=20, spread=10, angle=0, width=(4, 10), opacity=0.4)
            y += hh
    # Deep reveal: a dark band just inside the opening
    outer = arch_path(0)
    inner = arch_path(46)
    band = outer + list(reversed(inner))
    p.fill(band, "#1d1a17", strokes=10, spread=6)
    # Sconces (iron brackets) for the torches
    for tx in (520, 1880):
        p.fill([(tx - 30, 700), (tx + 30, 700), (tx + 18, 760), (tx - 18, 760)], "#1e1b19", strokes=0)
        p.fill([(tx - 44, 620), (tx + 44, 620), (tx + 26, 700), (tx - 26, 700)], "#2a2521", strokes=6, spread=8)
        p.line((tx, 760), (tx, 820), "#1e1b19", 10)
        p.raw('<path d="M%d 800q40 20 0 70" stroke="#1e1b19" stroke-width="8" fill="none"/>' % tx)
        # soot above the flame
        p.raw('<ellipse cx="%d" cy="520" rx="70" ry="120" fill="#151210" opacity=".35" filter="url(#soft)"/>' % tx)
    # Vignette
    p.raw('<rect width="%d" height="%d" fill="url(#vig)"/>' % (W, H))
    defs = ('<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#0d0b09" stop-opacity=".75"/></radialGradient>'
            '<filter id="soft" x="-50%%" y="-50%%" width="200%%" height="200%%"><feGaussianBlur stdDeviation="30"/></filter>'
            '<mask id="hole"><rect width="%d" height="%d" fill="#fff"/><polygon points="%s" fill="#000"/></mask>') % (W, H, pts(arch_path(46)))
    svg = p.svg(W, H, extra_defs=defs)
    # Cut the opening out of the whole painted wall
    return svg.replace('<g filter="url(#paint)">', '<g mask="url(#hole)"><g filter="url(#paint)">', 1).replace("</g></svg>", "</g></g></svg>")


def door(side):
    """One leaf. Drawn in its own box; the page positions it in the arch."""
    p = Painter(81 + side)
    rng = p.rng
    inset = 46
    x0, x1 = AX0 + inset, CX
    if side == 1:
        x0, x1 = CX, AX1 - inset
    shape = [q for q in arch_path(inset) if (x0 - 0.5 <= q[0] <= x1 + 0.5)]
    if side == 0:
        shape = [(x0, H)] + [q for q in shape if q[1] < H] + [(CX, SPRING - (R - inset)), (CX, H)]
    else:
        shape = [(CX, H), (CX, SPRING - (R - inset))] + [q for q in shape if q[1] < H] + [(x1, H)]
    cid = p.uid()
    p.defs.append('<clipPath id="%s"><polygon points="%s"/></clipPath>' % (cid, pts(shape)))
    g = ['<g clip-path="url(#%s)">' % cid]
    p.body.append("".join(g))
    # Planks
    n = 5
    pw = (x1 - x0) / n
    for i in range(n):
        px = x0 + i * pw
        col = rng.choice(["#5a3b23", "#4e331f", "#634228", "#553822"])
        p.fill([(px + 2, 0), (px + pw - 2, 0), (px + pw - 2, H), (px + 2, H)], col, strokes=90, spread=12, angle=1.5708, width=(2, 6), opacity=0.45, stroke_len=(80, 260))
        p.line((px + pw - 1, 0), (px + pw - 1, H), "#21160e", 4, 0.9)
    # Iron straps with a scrolled end towards the hinge side
    hinge_x = x0 if side == 0 else x1
    free_x = x1 if side == 0 else x0
    for sy in (330, 720, 1110):
        p.fill([(x0, sy - 22), (x1, sy - 22), (x1, sy + 22), (x0, sy + 22)], "#24211f", strokes=14, spread=8, angle=0, width=(2, 5))
        p.line((x0, sy - 20), (x1, sy - 20), "#4a4440", 3, 0.7)
        for k in range(9):
            sx = x0 + 30 + k * (x1 - x0 - 60) / 8
            p.raw('<circle cx="%.0f" cy="%d" r="9" fill="#151312"/><circle cx="%.0f" cy="%d" r="4" fill="#6b625a"/>' % (sx, sy, sx - 2, sy - 3))
        dx = -1 if side == 0 else 1
        fx = free_x - dx * 40
        p.raw('<path d="M%.0f %dq%.0f -60 %.0f -40q%.0f 10 %.0f 40" stroke="#24211f" stroke-width="14" fill="none" stroke-linecap="round"/>' % (
            fx, sy, dx * 40, dx * 70, dx * 20, dx * -10))
    # Ring pull near the meeting edge
    rx = CX - 70 if side == 0 else CX + 70
    p.raw('<circle cx="%d" cy="820" r="16" fill="#1b1816"/><circle cx="%d" cy="880" r="44" fill="none" stroke="#1b1816" stroke-width="12"/>'
          '<circle cx="%d" cy="878" r="44" fill="none" stroke="#5e5650" stroke-width="3" opacity=".7"/>' % (rx, rx, rx))
    # Shadow at the meeting edge, light on the hinge side
    shade_x = x1 - 60 if side == 0 else x0
    p.raw('<rect x="%.0f" y="0" width="60" height="%d" fill="#120c07" opacity=".45"/>' % (shade_x, H))
    p.body.append("</g>")
    return p.svg(W, H)


def light():
    p = Painter(91)
    defs = ('<radialGradient id="day" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff6df"/>'
            '<stop offset=".5" stop-color="#f4d9a1"/><stop offset="1" stop-color="#d9a660"/></radialGradient>')
    p.raw('<polygon points="%s" fill="url(#day)"/>' % pts(arch_path(40)))
    return p.svg(W, H, filt=False, extra_defs=defs)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out, exist_ok=True)
    for name, svg in [("gate-wall", wall()), ("gate-door-l", door(0)), ("gate-door-r", door(1)), ("gate-light", light())]:
        open(os.path.join(out, name + ".svg"), "w").write(svg)
        print("wrote", name)
