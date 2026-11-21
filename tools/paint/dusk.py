"""The town at dusk, for the footer: a skyline of roofs, towers and
domes against a fading sky, with lit windows and the town wall in front.

Usage: python tools/paint/dusk.py OUT_DIR      (writes dusk.svg, 2400 x 800)
"""

import math
import os
import sys

from common import Painter, mix

W, H = 2400, 800


def dusk():
    p = Painter(101)
    rng = p.rng
    defs = ('<linearGradient id="ds" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#2b3448"/><stop offset=".45" stop-color="#5a4a55"/>'
            '<stop offset=".75" stop-color="#b9774a"/><stop offset="1" stop-color="#e0a35a"/></linearGradient>'
            '<filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>')
    p.raw('<rect width="%d" height="%d" fill="url(#ds)"/>' % (W, H))
    for _ in range(40):
        x, y = rng.uniform(0, W), rng.uniform(0, 260)
        p.raw('<circle cx="%.0f" cy="%.0f" r="%.1f" fill="#f4ead2" opacity="%.2f"/>' % (x, y, rng.uniform(0.8, 1.8), rng.uniform(0.3, 0.8)))
    # Far layer: castle and domes, cool silhouette
    far = "#3a3340"
    base = 560
    x = 0
    shapes = []
    while x < W:
        w = rng.uniform(60, 150)
        h = rng.uniform(40, 110)
        shapes.append((x, w, h))
        x += w
    for x, w, h in shapes:
        p.fill([(x, base), (x, base - h), (x + w / 2, base - h - w * 0.45), (x + w, base - h), (x + w, base)], far)
    for cx, th, r in [(380, 260, 34), (720, 300, 44), (1560, 280, 38), (1900, 240, 30)]:
        p.fill([(cx - r * 0.7, base), (cx - r * 0.7, base - th), (cx + r * 0.7, base - th), (cx + r * 0.7, base)], far)
        pts_ = []
        for k in range(31):
            t = k / 30
            a = t * math.pi
            w = r * (math.sin(a) ** 0.8) * (1.15 - 0.6 * t)
            pts_.append((cx - w, base - th - t * r * 2.4))
        pts_ += [(2 * cx - px, py) for px, py in reversed(pts_)]
        p.fill(pts_, far)
        p.line((cx, base - th - r * 2.4), (cx, base - th - r * 3.1), far, 3)
        # a lit sliver on the domes where the last light catches them
        p.fill([(cx - r * 0.8, base - th - r * 0.4), (cx - r * 0.5, base - th - r * 0.4), (cx - r * 0.25, base - th - r * 1.6), (cx - r * 0.5, base - th - r * 1.4)], "#c8922a")
    # Keep on the hill
    p.fill([(1080, base), (1080, 200), (1180, 200), (1180, 250), (1260, 250), (1260, 160), (1340, 160), (1340, base)], far)
    p.fill([(1255, 160), (1345, 160), (1300, 70)], far)
    # Near houses: warmer silhouette with lit windows
    near = "#241d1c"
    x = -20
    while x < W:
        w = rng.uniform(110, 210)
        h = rng.uniform(150, 260)
        top = H - h
        p.fill([(x, H), (x, top), (x + w / 2, top - w * 0.55), (x + w, top), (x + w, H)], near, strokes=10, spread=6)
        for row in range(3):
            for col in range(2):
                if rng.random() < 0.55:
                    wx = x + w * (0.22 + col * 0.38)
                    wy = top + 30 + row * 60
                    if wy > H - 150:
                        continue
                    c = rng.choice(["#e39b3c", "#f0b75a", "#d98a34"])
                    p.raw('<rect x="%.0f" y="%.0f" width="20" height="28" fill="%s" opacity=".55" filter="url(#glow)"/>' % (wx - 4, wy - 4, c))
                    p.raw('<rect x="%.0f" y="%.0f" width="12" height="20" fill="%s"/>' % (wx, wy, c))
        x += w + rng.uniform(-10, 6)
    # Town wall with crenellations
    wall_top = H - 110
    p.fill([(0, H), (0, wall_top), (W, wall_top), (W, H)], "#2a2421", strokes=30, spread=6, angle=0)
    for cx in range(0, W, 64):
        p.fill([(cx, wall_top), (cx, wall_top - 34), (cx + 36, wall_top - 34), (cx + 36, wall_top)], "#2a2421")
    return p.svg(W, H, extra_defs=defs)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "dusk.svg"), "w").write(dusk())
    print("wrote dusk")
