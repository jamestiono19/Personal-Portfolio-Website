"""The market-lane scene, painted in depth layers.

Writes four SVG layers to the output folder:
  sky.svg   gradient sky, warm clouds, sun haze
  far.svg   castle on the hill, golden domes, the town gate (hazed)
  mid.svg   cobbled lane, the far half of the street, the plaza, people
  near.svg  the near houses, the market stall, bunting and lanterns

The camera stands in a sunlit market square at eye height, looking down
a lane towards the town gate. Geometry is real one-point perspective,
so the layers line up when stacked and can parallax apart.

Usage: python tools/paint/scene.py OUT_DIR
"""

import math
import os
import sys

from common import Camera, Painter, mix, jitter, pts

W, H = 2400, 1350
CAM = Camera(W, H, cx=1500, horizon=820, f=1500)

SKY_TOP = "#4f86b3"
SKY_MID = "#86b2d0"
SKY_LOW = "#e6d6b2"
HAZE = "#cfd3c8"

PLASTER = "#ead9b4"
PLASTER_SHADE = "#bba383"
TIMBER = "#4a3220"
STONE = "#9d907b"
STONE_SHADE = "#7b6f60"
TILE = "#9b4a31"
SLATE_ROOF = "#58606a"
GOLD = "#c8922a"
GOLD_HI = "#f2cd78"
BANNER = "#a8392b"
IVY = "#5d7a3a"
IVY_HI = "#86a052"
LANTERN = "#e39b3c"
SKY_BLUE = "#78a9cc"


def haze(color, z, k=230.0, amount=0.82):
    return mix(color, HAZE, amount * (1 - math.exp(-z / k)))


# ── Sky ────────────────────────────────────────────────────────────
def sky():
    p = Painter(11)
    defs = ('<linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="%s"/><stop offset=".45" stop-color="%s"/>'
            '<stop offset=".8" stop-color="%s"/><stop offset="1" stop-color="#efdcae"/></linearGradient>'
            '<radialGradient id="sun" cx=".18" cy=".2" r=".55"><stop offset="0" stop-color="#fff2cf" stop-opacity=".75"/>'
            '<stop offset="1" stop-color="#fff2cf" stop-opacity="0"/></radialGradient>'
            '<filter id="cl" x="-20%%" y="-40%%" width="140%%" height="180%%"><feGaussianBlur stdDeviation="14"/></filter>'
            '<filter id="cl2" x="-20%%" y="-40%%" width="140%%" height="180%%"><feGaussianBlur stdDeviation="5"/></filter>'
            ) % (SKY_TOP, SKY_MID, SKY_LOW)
    p.raw('<rect width="%d" height="%d" fill="url(#sk)"/>' % (W, H))
    p.raw('<rect width="%d" height="%d" fill="url(#sun)"/>' % (W, H))
    rng = p.rng
    # Cumulus banks: soft bodies with lit tops and cool undersides.
    banks = [(380, 300, 520, 1.0), (1150, 210, 420, 0.8), (1900, 330, 600, 1.1), (2350, 160, 380, 0.7), (700, 520, 700, 0.9), (1700, 560, 520, 0.7)]
    for bx, by, bw, s in banks:
        g = []
        for _ in range(int(26 * s)):
            x = bx + rng.uniform(-bw / 2, bw / 2)
            y = by + rng.uniform(-40, 30) * s - abs(x - bx) / bw * 30
            r = rng.uniform(40, 110) * s
            g.append('<ellipse cx="%.0f" cy="%.0f" rx="%.0f" ry="%.0f" fill="%s" opacity=".55"/>' % (x, y + 18, r * 1.25, r * 0.55, "#9fb6c6"))
        for _ in range(int(30 * s)):
            x = bx + rng.uniform(-bw / 2, bw / 2)
            y = by + rng.uniform(-50, 10) * s - abs(x - bx) / bw * 30
            r = rng.uniform(34, 95) * s
            g.append('<ellipse cx="%.0f" cy="%.0f" rx="%.0f" ry="%.0f" fill="%s" opacity=".75"/>' % (x, y, r * 1.1, r * 0.7, rng.choice(["#fbf1dc", "#f6e6c4", "#fff7e6", "#efd9b1"])))
        p.raw('<g filter="url(#cl)">%s</g>' % "".join(g))
        # crisp lit edges on top
        e = []
        for _ in range(int(16 * s)):
            x = bx + rng.uniform(-bw / 2.4, bw / 2.4)
            y = by - rng.uniform(20, 70) * s
            e.append('<ellipse cx="%.0f" cy="%.0f" rx="%.0f" ry="%.0f" fill="#fffaf0" opacity=".5"/>' % (x, y, rng.uniform(18, 50) * s, rng.uniform(10, 26) * s))
        p.raw('<g filter="url(#cl2)">%s</g>' % "".join(e))
    # A few long brush strokes across the sky.
    for _ in range(70):
        x, y = rng.uniform(0, W), rng.uniform(0, 650)
        L = rng.uniform(80, 260)
        p.raw('<path d="M%.0f %.0fq%.0f %.0f %.0f %.0f" stroke="%s" stroke-width="%.0f" fill="none" stroke-linecap="round" opacity=".12"/>' % (
            x, y, L / 2, rng.uniform(-8, 8), L, rng.uniform(-6, 6), jitter(mix(SKY_MID, SKY_TOP, y / 700), rng, 14), rng.uniform(8, 22)))
    return p.svg(W, H, filt=False, extra_defs=defs)


# ── Far: hill, castle, domes, gate ────────────────────────────────
def far():
    p = Painter(23)
    rng = p.rng
    # Distant hill line
    hill = [(0, 820)]
    for i in range(0, W + 1, 60):
        hill.append((i, 760 - 70 * math.exp(-((i - 1650) / 520) ** 2) - 18 * math.sin(i / 170.0)))
    hill += [(W, 820)]
    p.fill(hill, haze("#6d7f5d", 600, amount=0.9), strokes=40, spread=6, angle=0)

    # Castle keep and curtain wall on the hill (Z ~ 320)
    z = 320.0
    def box(x0, x1, y0, y1, zz, col):
        p.fill(CAM.poly([(x0, y0, zz), (x1, y0, zz), (x1, y1, zz), (x0, y1, zz)]), col, strokes=12, spread=6, angle=1.57, width=(2, 5))
    wallc = haze(STONE, z, amount=0.88)
    box(-46, 22, 18, 34, z, wallc)
    for tx, tw, th, roof in [(-44, 7, 60, "cone"), (-26, 10, 78, "dome"), (-4, 8, 58, "cone"), (12, 7, 50, "cone")]:
        box(tx, tx + tw, 18, th, z, haze("#a8987e", z, amount=0.85))
        # windows
        for wy in range(30, int(th) - 6, 9):
            box(tx + tw / 2 - 0.6, tx + tw / 2 + 0.6, wy, wy + 2.6, z - 1, haze("#3e3a3a", z, amount=0.7))
        if roof == "cone":
            p.fill(CAM.poly([(tx - 1, th, z), (tx + tw + 1, th, z), (tx + tw / 2, th + tw * 2.1, z)]), haze(SLATE_ROOF, z, amount=0.75), strokes=10, spread=6)
        else:
            dome(p, tx + tw / 2, th, z, tw * 0.75, haze(GOLD, z, amount=0.45), haze(GOLD_HI, z, amount=0.4))
    # crenellations
    for cx_ in range(-46, 22, 2):
        box(cx_, cx_ + 1, 34, 35.6, z, wallc)

    # Golden domes of the town (Z 150-230), left of the lane
    for dx, dz, base, r in [(-58, 190, 40, 6.5), (-34, 170, 34, 5.0), (-84, 220, 44, 8.0), (-18, 210, 38, 4.5)]:
        tower_c = haze("#d8c7a2", dz, amount=0.7)
        box(dx - r * 0.9, dx + r * 0.9, 0, base, dz, tower_c)
        box(dx - r * 0.9, dx - r * 0.3, 0, base, dz - 0.5, haze("#b3a283", dz, amount=0.7))
        for wy in (base * 0.45, base * 0.75):
            box(dx - 0.5, dx + 0.5, wy, wy + 2.2, dz - 1, haze("#4a4240", dz, amount=0.6))
        dome(p, dx, base, dz, r, haze(GOLD, dz, amount=0.35), haze(GOLD_HI, dz, amount=0.3))
    # Spires
    for sx, sz, sh in [(-46, 185, 52), (-6, 250, 56), (-100, 260, 50)]:
        box(sx - 1.6, sx + 1.6, 0, sh, sz, haze("#c9b994", sz, amount=0.72))
        p.fill(CAM.poly([(sx - 2.2, sh, sz), (sx + 2.2, sh, sz), (sx, sh + 16, sz)]), haze(SLATE_ROOF, sz, amount=0.7), strokes=6)
        a = CAM.p(sx, sh + 16, sz); b = CAM.p(sx, sh + 19, sz)
        p.line(a, b, haze(GOLD, sz, amount=0.3), 2)

    # Distant roofs between the domes and the gate
    for i in range(16):
        rx = -120 + i * 7.5 + rng.uniform(-1, 1)
        rz = rng.uniform(120, 160)
        rh = rng.uniform(7, 12)
        col = haze(rng.choice([PLASTER, "#d9c39b", "#cdb48a"]), rz, amount=0.78)
        box(rx, rx + 6, 0, rh, rz, col)
        p.fill(CAM.poly([(rx - 0.4, rh, rz), (rx + 6.4, rh, rz), (rx + 3, rh + 4.2, rz)]), haze(rng.choice([TILE, "#87412d", SLATE_ROOF]), rz, amount=0.7), strokes=6)

    # The town gate at the end of the lane (Z 88)
    gz = 88.0
    gs = haze(STONE, gz, amount=0.6)
    gs2 = haze(STONE_SHADE, gz, amount=0.6)
    box(-7, 9, 0, 13, gz, gs)
    # arch opening shows bright land beyond
    arch = [CAM.p(-1.6, 0, gz - 0.2)]
    for k in range(0, 19):
        a = math.pi - k * math.pi / 18
        arch.append(CAM.p(1 + 2.6 * math.cos(a), 6.4 + 2.6 * math.sin(a), gz - 0.2))
    arch.append(CAM.p(3.6, 0, gz - 0.2))
    p.fill(arch, haze("#e9dcb8", 400, amount=0.6), strokes=6, spread=6)
    for tx in (-11, 9):
        box(tx, tx + 5, 0, 22, gz - 2, gs2 if tx < 0 else gs)
        for cx_ in range(0, 5, 2):
            box(tx + cx_, tx + cx_ + 1, 22, 23.4, gz - 2, gs if tx < 0 else gs2)
        p.fill(CAM.poly([(tx - 0.6, 23.4, gz - 2), (tx + 5.6, 23.4, gz - 2), (tx + 2.5, 32, gz - 2)]), haze(SLATE_ROOF, gz, amount=0.5), strokes=8)
        f0 = CAM.p(tx + 2.5, 32, gz - 2); f1 = CAM.p(tx + 2.5, 35.5, gz - 2)
        p.line(f0, f1, haze(TIMBER, gz, amount=0.4), 2)
        fl = CAM.poly([(tx + 2.5, 35.4, gz - 2), (tx + 5.5, 34.8, gz - 2), (tx + 2.5, 34.0, gz - 2)])
        p.fill(fl, haze(BANNER, gz, amount=0.3))
    for cx_ in range(-7, 9, 2):
        box(cx_, cx_ + 1, 13, 14.2, gz, gs)
    return p.svg(W, H)


def dome(p, x, base, z, r, col, hi):
    """Onion dome: a bulb outline with a lit flank and a finial."""
    pts_ = []
    for k in range(0, 41):
        t = k / 40.0
        a = t * math.pi
        # onion profile: wide at 35% height, pinched to a point
        yy = base + t * r * 2.4
        w = r * (math.sin(a) ** 0.8) * (1.15 - 0.6 * t)
        pts_.append((x - w, yy))
    right = [(x + (x - px), py) for px, py in reversed(pts_)]
    outline = [CAM.p(px, py, z) for px, py in pts_ + right]
    p.fill(outline, col, strokes=18, spread=10, angle=1.4, width=(2, 6))
    lit = []
    for k in range(0, 41):
        t = k / 40.0
        a = t * math.pi
        yy = base + t * r * 2.4
        w = r * (math.sin(a) ** 0.8) * (1.15 - 0.6 * t)
        lit.append(CAM.p(x - w * 0.95, yy, z - 0.1))
    for k in range(40, -1, -1):
        t = k / 40.0
        a = t * math.pi
        yy = base + t * r * 2.4
        w = r * (math.sin(a) ** 0.8) * (1.15 - 0.6 * t)
        lit.append(CAM.p(x - w * 0.35, yy, z - 0.1))
    p.fill(lit, hi, strokes=8, spread=8, angle=1.4, width=(2, 4))
    a = CAM.p(x, base + r * 2.4, z); b = CAM.p(x, base + r * 2.4 + r * 0.7, z)
    p.line(a, b, hi, max(1.5, 900 / z * 0.25))
    c = CAM.p(x, base + r * 2.4 + r * 0.45, z)
    p.raw('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (c[0], c[1], max(1.5, 1500 * r * 0.12 / z), hi))


# ── A half-timbered house front on the right side of the lane ─────
def house(p, z0, z1, floors, xf, palette, rng, near=False, sign=None):
    """Facade on the plane X = xf, spanning depth z0..z1. Upper floors
    jetty out over the street by 0.3 m each, like the real thing."""
    plaster, timber, roof = palette
    zz = (z0 + z1) / 2
    hz = lambda c: haze(c, zz)
    stroke_n = 60 if near else 26
    # Stone ground floor
    g = CAM.poly([(xf, 0, z0), (xf, 3.1, z0), (xf, 3.1, z1), (xf, 0, z1)])
    p.fill(g, hz(STONE), strokes=stroke_n, spread=14, angle=0.2, width=(3, 10) if near else (2, 5))
    # stone courses
    for yy in (0.7, 1.4, 2.1, 2.8):
        a = CAM.p(xf, yy, z0); b = CAM.p(xf, yy, z1)
        p.line(a, b, hz(STONE_SHADE), 1.2 if not near else 2.2, 0.55)
    # shop door: arch
    dz0 = z0 + (z1 - z0) * 0.62
    dz1 = dz0 + min(1.3, (z1 - z0) * 0.25)
    door = CAM.poly([(xf - 0.01, 0, dz0), (xf - 0.01, 2.2, dz0), (xf - 0.01, 2.55, (dz0 + dz1) / 2), (xf - 0.01, 2.2, dz1), (xf - 0.01, 0, dz1)])
    p.fill(door, hz("#3a2a1e"), strokes=10, spread=6, angle=1.57)
    # shop window with warm interior
    wz0 = z0 + (z1 - z0) * 0.12
    wz1 = z0 + (z1 - z0) * 0.5
    win = CAM.poly([(xf - 0.01, 0.8, wz0), (xf - 0.01, 2.4, wz0), (xf - 0.01, 2.4, wz1), (xf - 0.01, 0.8, wz1)])
    p.fill(win, hz("#6b4a2a"), strokes=14, spread=16, angle=1.57)
    glow = CAM.poly([(xf - 0.02, 0.9, wz0 + 0.2), (xf - 0.02, 1.6, wz0 + 0.2), (xf - 0.02, 1.6, wz1 - 0.2), (xf - 0.02, 0.9, wz1 - 0.2)])
    p.fill(glow, hz("#c98b45"), strokes=8, spread=14, angle=0)
    # Upper floors
    y = 3.1
    x = xf
    for fl in range(floors):
        x -= 0.3
        y0, y1 = y, y + 2.8
        # jetty underside (shadow line)
        sh = CAM.poly([(x + 0.3, y0, z0), (x, y0, z0), (x, y0, z1), (x + 0.3, y0, z1)])
        p.fill(sh, hz("#3b2b20"))
        face = CAM.poly([(x, y0, z0), (x, y1, z0), (x, y1, z1), (x, y0, z1)])
        p.fill(face, hz(plaster), strokes=stroke_n, spread=10, angle=0.1, width=(3, 11) if near else (2, 6))
        # timber posts every ~1.1 m, braces in alternate bays
        n = max(2, int((z1 - z0) / 1.1))
        tw = 0.16
        for i in range(n + 1):
            pz = z0 + (z1 - z0) * i / n
            post = CAM.poly([(x - 0.01, y0, pz - tw / 2), (x - 0.01, y1, pz - tw / 2), (x - 0.01, y1, pz + tw / 2), (x - 0.01, y0, pz + tw / 2)])
            p.fill(post, hz(timber), strokes=4 if near else 0, spread=8, angle=1.57)
            if i < n and (i + fl) % 3 == 0:
                pz1 = z0 + (z1 - z0) * (i + 1) / n
                br = CAM.poly([(x - 0.01, y0 + 0.1, pz), (x - 0.01, y0 + 0.35, pz), (x - 0.01, y1 - 0.1, pz1), (x - 0.01, y1 - 0.35, pz1)])
                p.fill(br, hz(timber))
        for yy in (y0, y0 + 1.0, y1 - 0.12):
            beam = CAM.poly([(x - 0.01, yy, z0), (x - 0.01, yy + 0.16, z0), (x - 0.01, yy + 0.16, z1), (x - 0.01, yy, z1)])
            p.fill(beam, hz(timber))
        # windows in bays where there is no brace
        for i in range(n):
            if (i + fl) % 3 == 0:
                continue
            pz0 = z0 + (z1 - z0) * i / n + 0.22
            pz1 = z0 + (z1 - z0) * (i + 1) / n - 0.22
            wy0, wy1 = y0 + 1.25, y0 + 2.45
            wf = CAM.poly([(x - 0.02, wy0, pz0), (x - 0.02, wy1, pz0), (x - 0.02, wy1, pz1), (x - 0.02, wy0, pz1)])
            sky_ref = rng.choice(["#55667a", "#4c5a6b", "#6f8196", "#8a7350"])
            p.fill(wf, hz(sky_ref), strokes=8 if near else 3, spread=18, angle=-0.8, width=(2, 6))
            # leading
            mz = (pz0 + pz1) / 2
            p.line(CAM.p(x - 0.03, wy0, mz), CAM.p(x - 0.03, wy1, mz), hz(timber), 1.5 if near else 0.8, 0.8)
            p.line(CAM.p(x - 0.03, (wy0 + wy1) / 2, pz0), CAM.p(x - 0.03, (wy0 + wy1) / 2, pz1), hz(timber), 1.5 if near else 0.8, 0.8)
            # flower box
            if rng.random() < 0.45:
                fb = CAM.poly([(x - 0.25, wy0 - 0.25, pz0), (x - 0.25, wy0, pz0), (x - 0.25, wy0, pz1), (x - 0.25, wy0 - 0.25, pz1)])
                p.fill(fb, hz(timber))
                for _ in range(10 if near else 5):
                    fz = rng.uniform(pz0, pz1)
                    c = CAM.p(x - 0.3, wy0 + rng.uniform(0, 0.25), fz)
                    r = max(1.2, 1500 * 0.09 / fz)
                    p.raw('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (c[0], c[1], r, hz(rng.choice([BANNER, "#c4513a", IVY_HI, "#e9c46a"]))))
        y = y1
    # Gable facing the street
    ridge = y + (z1 - z0) * 0.75
    gab = CAM.poly([(x, y, z0), (x, ridge, zz), (x, y, z1)])
    p.fill(gab, hz(plaster), strokes=stroke_n // 2, spread=10)
    k = CAM.poly([(x - 0.01, y, zz - 0.08), (x - 0.01, ridge - 0.3, zz - 0.08), (x - 0.01, ridge - 0.3, zz + 0.08), (x - 0.01, y, zz + 0.08)])
    p.fill(k, hz(timber))
    # barge boards / roof edge with tiles
    for side in (0, 1):
        za, zb = (z0 - 0.35, zz) if side == 0 else (zz, z1 + 0.35)
        ya, yb = (y - 0.25, ridge + 0.25) if side == 0 else (ridge + 0.25, y - 0.25)
        edge = CAM.poly([(x - 0.4, ya, za), (x - 0.4, yb, zb), (x - 0.4, yb - 0.45, zb), (x - 0.4, ya - 0.45, za)])
        p.fill(edge, hz(roof), strokes=10 if near else 3, spread=14)
    # gable window
    gw = CAM.poly([(x - 0.02, y + 0.6, zz - 0.4), (x - 0.02, y + 1.6, zz - 0.4), (x - 0.02, y + 1.6, zz + 0.4), (x - 0.02, y + 0.6, zz + 0.4)])
    p.fill(gw, hz("#55667a"))
    # Ivy up one corner
    if rng.random() < 0.55:
        iz = z0 + rng.uniform(0.1, 0.5) * (z1 - z0)
        for _ in range(90 if near else 40):
            yy = rng.uniform(0, 3.1 + 2.8 * rng.random() * floors * 0.7)
            spread = 0.9 * (1 - yy / 10)
            c = CAM.p(xf - 0.35, yy, iz + rng.uniform(-spread, spread))
            r = max(1.2, 1500 * rng.uniform(0.07, 0.16) / iz)
            p.raw('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" opacity=".9"/>' % (c[0], c[1], r, hz(rng.choice([IVY, "#4b6a2f", IVY_HI, "#6f8c43"]))))
    # Hanging sign on an iron bracket
    if sign:
        sz = z0 + 0.6
        a = CAM.p(xf, 3.8, sz); b = CAM.p(xf - 1.5, 3.8, sz)
        p.line(a, b, hz("#231c17"), max(1.2, 1500 * 0.05 / sz))
        p.line(CAM.p(xf, 3.3, sz), CAM.p(xf - 0.9, 3.8, sz), hz("#231c17"), max(1, 1500 * 0.035 / sz))
        board = CAM.poly([(xf - 0.35, 3.65, sz), (xf - 1.4, 3.65, sz), (xf - 1.4, 2.85, sz), (xf - 0.35, 2.85, sz)])
        for hx in (xf - 0.5, xf - 1.25):
            p.line(CAM.p(hx, 3.8, sz), CAM.p(hx, 3.65, sz), hz("#231c17"), 1.2)
        p.fill(board, hz(sign), strokes=6, spread=10, angle=0)
        rim = CAM.poly([(xf - 0.42, 3.58, sz - 0.01), (xf - 1.33, 3.58, sz - 0.01), (xf - 1.33, 2.92, sz - 0.01), (xf - 0.42, 2.92, sz - 0.01)])
        p.raw('<polygon points="%s" fill="none" stroke="%s" stroke-width="1.5" opacity=".7"/>' % (pts(rim), hz(GOLD)))


def right_row(p, zmin, zmax, near):
    rng = p.rng
    z = 3.0
    houses = []
    while z < 72:
        wdt = rng.uniform(4.6, 7.0)
        houses.append((z, z + wdt, rng.choice([2, 2, 3]), 4.0 + rng.uniform(-0.25, 0.35)))
        z += wdt
    signs = [BANNER, IVY, "#3c6a8c", None, GOLD, None]
    # Backing wall and roof mass, so no sky shows between the jettied fronts.
    za, zb = max(zmin, 3.0), min(zmax, 74.0)
    back = CAM.poly([(4.6, 0, za), (4.6, 13.5, za), (4.6, 13.5, zb), (4.6, 0, zb)])
    p.fill(back, haze("#b49c7c", (za + zb) / 2), strokes=30 if near else 14, spread=10, angle=0.1)
    roofb = CAM.poly([(4.6, 13.5, za), (6.5, 16.5, za), (6.5, 16.5, zb), (4.6, 13.5, zb)])
    p.fill(roofb, haze("#7e3f2c", (za + zb) / 2), strokes=30 if near else 14, spread=12, angle=0.3)
    for i, (z0, z1, fl, xf) in enumerate(reversed(houses)):
        if not (zmin <= z0 < zmax):
            continue
        pal = (rng.choice([PLASTER, "#efe0bd", "#e2cfa7", "#f0dcb0"]), rng.choice([TIMBER, "#563a24", "#3e2a1b"]), rng.choice([TILE, "#8e4430", "#a35a36", SLATE_ROOF]))
        idx = len(houses) - 1 - i
        house(p, z0, z1, fl, xf, pal, rng, near=near, sign=signs[idx % len(signs)] if idx < 6 else None)


def cobbles(p, z0, z1, x0, x1):
    rng = p.rng
    z = z0
    while z < z1:
        dz = 0.22 + z * 0.012
        x = x0 + rng.uniform(0, 0.3)
        while x < x1:
            w = rng.uniform(0.22, 0.34)
            c = CAM.p(x + w / 2, 0, z + dz / 2)
            rx = 1500 * w / (z + dz / 2) / 2 * 0.92
            ry = max(0.6, (CAM.p(0, 0, z)[1] - CAM.p(0, 0, z + dz)[1]) / 2 * 0.85)
            if rx < 0.6:
                break
            base = rng.choice(["#8d826f", "#7d7262", "#958a77", "#6f6658", "#a19682"])
            # warm light pools near the shops, cool sky reflection in the middle
            if -1.0 < x < 2.5 and rng.random() < 0.25:
                base = mix(base, "#aac3d6", 0.35)
            if x > 2.6 and rng.random() < 0.3:
                base = mix(base, "#d9a25c", 0.3)
            col = haze(base, z)
            p.raw('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s"/>' % (c[0], c[1], rx, ry, col))
            if ry > 3:
                p.raw('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" opacity=".35"/>' % (c[0] - rx * 0.2, c[1] - ry * 0.35, rx * 0.5, ry * 0.3, "#efe4cf"))
            x += w + 0.035
        z += dz + 0.02


def ground(p):
    # grout / earth under the stones
    g = [CAM.p(-60, 0, 2), CAM.p(4.2, 0, 2), CAM.p(4.2, 0, 90), CAM.p(-60, 0, 90)]
    g = [(max(-2000, a), b) for a, b in g]
    p.fill([(-10, H), (W + 10, H), (W + 10, CAM.p(0, 0, 90)[1]), (-10, CAM.p(0, 0, 90)[1])], haze("#4b443b", 30), strokes=0)
    cobbles(p, 2.2, 90, -16, 4.0)
    # Sunlight lying along the right of the lane, cool shade on the left
    sun = CAM.poly([(0.8, 0, 2.2), (4.0, 0, 2.2), (4.0, 0, 60), (2.6, 0, 60)])
    p.raw('<polygon points="%s" fill="#f3c98a" opacity=".16"/>' % pts(sun))
    shade = CAM.poly([(-16, 0, 2.2), (-3.0, 0, 2.2), (-6, 0, 30), (-16, 0, 30)])
    p.raw('<polygon points="%s" fill="#3c4a5c" opacity=".18"/>' % pts(shade))
    # wet reflections: long vertical smears under the sunlit fronts and lanterns
    rng = p.rng
    for _ in range(22):
        z = rng.uniform(4, 40)
        x = rng.uniform(1.5, 3.8)
        a = CAM.p(x, 0, z)
        L = 1500 * rng.uniform(0.4, 1.2) / z
        p.raw('<path d="M%.1f %.1fl0 %.1f" stroke="%s" stroke-width="%.1f" opacity=".18" stroke-linecap="round" filter="url(#bloom)"/>' % (
            a[0], a[1], L, rng.choice(["#efd7a6", LANTERN, "#e8dcc0"]), max(3, 1500 * 0.35 / z)))
    for _ in range(14):
        z = rng.uniform(4, 40)
        x = rng.uniform(-4, 1)
        a = CAM.p(x, 0, z)
        L = 1500 * rng.uniform(0.3, 0.9) / z
        p.raw('<path d="M%.1f %.1fl0 %.1f" stroke="%s" stroke-width="%.1f" opacity=".16" stroke-linecap="round" filter="url(#bloom)"/>' % (
            a[0], a[1], L, "#b8d0e2", max(3, 1500 * 0.4 / z)))


def person(p, x, z, color, rng):
    h = rng.uniform(1.55, 1.8)
    head = CAM.p(x, h - 0.12, z)
    r = 1500 * 0.12 / z
    body = CAM.poly([(x - 0.22, h - 0.25, z), (x + 0.22, h - 0.25, z), (x + 0.3, 0.05, z), (x - 0.3, 0.05, z)])
    sh = CAM.poly([(x - 0.35, 0, z), (x + 0.6, 0, z + 0.4), (x + 0.3, 0, z + 0.7), (x - 0.45, 0, z + 0.2)])
    p.fill(sh, "#3b352d", strokes=0)
    p.fill(body, haze(color, z), strokes=4, spread=10, angle=1.57)
    p.raw('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (head[0], head[1], r, haze("#c79a73", z)))
    # sunlit edge
    edge = CAM.poly([(x - 0.22, h - 0.25, z), (x - 0.12, h - 0.25, z), (x - 0.18, 0.05, z), (x - 0.3, 0.05, z)])
    p.fill(edge, haze("#f2d6a0", z), strokes=0)


def bunting(p, z, y_r, y_l, x_r=3.6, x_l=-7.5, sag=0.9, flags=26):
    rng = p.rng
    cols = [BANNER, PLASTER, IVY, GOLD, "#3c6a8c", "#c4513a"]
    prev = None
    line_pts = []
    for i in range(flags * 3 + 1):
        t = i / (flags * 3)
        x = x_r + (x_l - x_r) * t
        y = y_r + (y_l - y_r) * t - sag * 4 * t * (1 - t)
        line_pts.append(CAM.p(x, y, z))
    p.raw('<polyline points="%s" fill="none" stroke="#2c241d" stroke-width="%.1f" opacity=".85"/>' % (pts(line_pts), max(1, 1500 * 0.02 / z)))
    for i in range(flags):
        t0 = (i + 0.1) / flags
        t1 = (i + 0.85) / flags
        tm = (t0 + t1) / 2
        def at(t):
            x = x_r + (x_l - x_r) * t
            y = y_r + (y_l - y_r) * t - sag * 4 * t * (1 - t)
            return x, y
        a, b, m = at(t0), at(t1), at(tm)
        tri = CAM.poly([(a[0], a[1], z), (b[0], b[1], z), (m[0] + rng.uniform(-0.05, 0.05), m[1] - 0.55, z)])
        p.fill(tri, haze(cols[i % len(cols)], z * 0.5), strokes=3, spread=14, angle=1.4, width=(2, 5))


def lantern(p, x, y, z, lit=True):
    c = CAM.p(x, y, z)
    r = 1500 * 0.15 / z
    p.raw('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" opacity=".25" filter="url(#bloom)"/>' % (c[0], c[1], r * 2.6, LANTERN))
    p.raw('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s"/>' % (c[0], c[1], r, r * 1.25, LANTERN))
    p.raw('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#ffd68a" opacity=".85"/>' % (c[0] - r * 0.25, c[1] - r * 0.2, r * 0.45, r * 0.7))
    for k in (-0.5, 0, 0.5):
        p.raw('<path d="M%.1f %.1fq%.1f %.1f 0 %.1f" stroke="#a5631f" stroke-width="%.1f" fill="none" opacity=".6"/>' % (
            c[0] + k * r, c[1] - r * 1.2, k * r * 0.3, r * 1.2, r * 2.4, max(0.8, r * 0.08)))
    top = CAM.p(x, y + 0.3, z)
    p.raw('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#2c241d"/>' % (c[0] - r * 0.45, c[1] - r * 1.4, r * 0.9, r * 0.25))
    p.line(top, (c[0], c[1] - r * 1.3), "#2c241d", max(0.8, r * 0.06))


BLOOM = '<filter id="bloom" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10"/></filter>'


# ── Mid: lane floor, far half of the street, plaza ────────────────
def mid():
    p = Painter(37)
    rng = p.rng
    ground(p)
    # Plaza buildings on the left, across the square (shade side)
    for i in range(16):
        bx = -110 + i * 6.2
        bz = 74 + rng.uniform(-3, 5)
        bh = rng.uniform(6.0, 8.5)
        col = haze(rng.choice(["#d6c19a", "#cdb68f", "#c7ae84"]), bz)
        f = CAM.poly([(bx, 0, bz), (bx, bh, bz), (bx + 6, bh, bz), (bx + 6, 0, bz)])
        p.fill(f, col, strokes=20, spread=8, angle=0)
        for wx in (bx + 1.2, bx + 3.8):
            for wy in (1.0, 4.0):
                p.fill(CAM.poly([(wx, wy, bz - 0.05), (wx, wy + 1.6, bz - 0.05), (wx + 1.0, wy + 1.6, bz - 0.05), (wx + 1.0, wy, bz - 0.05)]), haze("#5a5a5c", bz))
        for tx in (bx, bx + 2, bx + 4, bx + 6):
            p.fill(CAM.poly([(tx - 0.1, 2.9, bz - 0.06), (tx - 0.1, bh, bz - 0.06), (tx + 0.1, bh, bz - 0.06), (tx + 0.1, 2.9, bz - 0.06)]), haze(TIMBER, bz))
        p.fill(CAM.poly([(bx - 0.4, bh, bz), (bx + 6.4, bh, bz), (bx + 3, bh + 3.6, bz)]), haze(rng.choice([TILE, SLATE_ROOF, "#8e4430"]), bz), strokes=10, spread=10)
    # The far half of the right-hand row
    right_row(p, 22, 200, near=False)
    # Distant bunting and lanterns
    bunting(p, 30, 7.4, 7.0, x_l=-5, sag=0.7, flags=22)
    for lx, lz in [(-1.5, 30.0), (1.5, 30.0)]:
        lantern(p, lx, 6.2, lz)
    # People in the lane
    for x, z, c in [(0.6, 18, "#6b4a30"), (-1.2, 24, "#3c6a8c"), (2.4, 29, BANNER), (-0.4, 36, "#5d7a3a"), (1.4, 44, "#7a5b3e"), (-2.6, 52, "#46301f"), (0.8, 60, "#a8392b")]:
        person(p, x, z, c, rng)
    return p.svg(W, H, extra_defs=BLOOM)


# ── Near: the first houses, the stall, near bunting ───────────────
def near():
    p = Painter(53)
    rng = p.rng
    right_row(p, 0, 22, near=True)
    # Near bunting across the top edge
    # The nearest string of bunting is drawn in the page so it can sway.
    bunting(p, 15.0, 6.6, 6.3, x_r=3.5, x_l=-6.0, sag=0.8, flags=22)
    for lx in (-1.0, 1.6):
        lantern(p, lx, 5.3, 15.0)
    # bracket lanterns on the near houses
    for lz in (9.0, 15.5):
        a = CAM.p(3.7, 3.9, lz); b = CAM.p(3.0, 3.9, lz)
        p.line(a, b, "#231c17", max(1.5, 1500 * 0.05 / lz))
        lantern(p, 3.0, 3.4, lz)
    # Foreground ivy spilling in from the top right
    for _ in range(260):
        x = rng.uniform(W - 520, W + 40)
        y = rng.uniform(-30, 260) * (1 - (W - x) / 900) + rng.uniform(0, 60)
        r = rng.uniform(6, 16)
        p.raw('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" transform="rotate(%.0f %.1f %.1f)"/>' % (
            x, y, r, r * 0.55, rng.choice([IVY, "#4b6a2f", IVY_HI, "#3d5a26", "#6f8c43"]), rng.uniform(0, 180), x, y))
    return p.svg(W, H, extra_defs=BLOOM)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out, exist_ok=True)
    for name, fn in [("sky", sky), ("far", far), ("mid", mid), ("near", near)]:
        with open(os.path.join(out, name + ".svg"), "w") as fh:
            fh.write(fn())
        print("wrote", name)
