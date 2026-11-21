"""Shared helpers for the painted scene generators.

Everything is drawn as SVG from simple geometry, then rasterised by
render.js (headless Chromium). A seeded RNG keeps every run identical,
so the committed images can be rebuilt byte-for-byte in spirit.
"""

import math
import random


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb2hex(c):
    return "#%02x%02x%02x" % tuple(max(0, min(255, int(round(v)))) for v in c)


def mix(a, b, t):
    """Blend two hex colours, t=0 gives a, t=1 gives b."""
    ca, cb = hex2rgb(a), hex2rgb(b)
    return rgb2hex([ca[i] + (cb[i] - ca[i]) * t for i in range(3)])


def jitter(color, rng, amount=10):
    """A neighbouring tone of the same colour, for brushwork."""
    c = hex2rgb(color)
    d = rng.uniform(-amount, amount)
    warm = rng.uniform(-amount * 0.5, amount * 0.5)
    return rgb2hex([c[0] + d + warm, c[1] + d, c[2] + d - warm])


class Camera:
    """One-point perspective: X right, Y up, Z into the picture (metres)."""

    def __init__(self, w, h, cx, horizon, f, eye=1.7):
        self.w, self.h, self.cx, self.cy, self.f, self.eye = w, h, cx, horizon, f, eye

    def p(self, x, y, z):
        z = max(z, 0.05)
        return (self.cx + self.f * x / z, self.cy - self.f * (y - self.eye) / z)

    def poly(self, pts):
        return [self.p(*q) for q in pts]


def pts(points):
    return " ".join("%.1f,%.1f" % (x, y) for x, y in points)


class Painter:
    """Collects SVG fragments. `fill` paints a polygon and lays loose
    brush strokes over it, clipped to the shape, so flat areas read as
    paint instead of vector fills."""

    def __init__(self, seed):
        self.rng = random.Random(seed)
        self.defs = []
        self.body = []
        self.n = 0

    def uid(self, p="c"):
        self.n += 1
        return "%s%d" % (p, self.n)

    def raw(self, s):
        self.body.append(s)

    def fill(self, poly, color, strokes=0, spread=10, angle=None, width=(3, 9), opacity=0.35, stroke_len=(14, 60)):
        rng = self.rng
        if strokes <= 0:
            self.body.append('<polygon points="%s" fill="%s"/>' % (pts(poly), color))
            return
        cid = self.uid()
        self.defs.append('<clipPath id="%s"><polygon points="%s"/></clipPath>' % (cid, pts(poly)))
        xs = [q[0] for q in poly]
        ys = [q[1] for q in poly]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        out = ['<g clip-path="url(#%s)">' % cid,
               '<polygon points="%s" fill="%s"/>' % (pts(poly), color)]
        area = max(1.0, (x1 - x0) * (y1 - y0))
        n = int(min(strokes, max(3, area / 900.0 * strokes / 10.0)))
        for _ in range(n):
            x = rng.uniform(x0, x1)
            y = rng.uniform(y0, y1)
            a = angle if angle is not None else rng.uniform(-0.5, 0.5)
            a += rng.uniform(-0.25, 0.25)
            L = rng.uniform(*stroke_len)
            dx, dy = math.cos(a) * L, math.sin(a) * L
            out.append('<path d="M%.1f %.1fq%.1f %.1f %.1f %.1f" stroke="%s" stroke-width="%.1f" stroke-linecap="round" fill="none" opacity="%.2f"/>' % (
                x, y, dx / 2 + rng.uniform(-4, 4), dy / 2 + rng.uniform(-4, 4), dx, dy,
                jitter(color, rng, spread), rng.uniform(*width), rng.uniform(opacity * 0.5, opacity)))
        out.append("</g>")
        self.body.append("".join(out))

    def line(self, a, b, color, w=2, opacity=1.0, cap="round"):
        self.body.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%.2f" stroke-linecap="%s" opacity="%.2f"/>' % (
            a[0], a[1], b[0], b[1], color, w, cap, opacity))

    def svg(self, w, h, filt=True, extra_defs=""):
        """Wrap the layer. The filter wobbles every edge slightly and adds a
        fine grain, which is what keeps the shapes from looking vector-made."""
        f = ""
        if filt:
            f = ('<filter id="paint" x="-2%%" y="-2%%" width="104%%" height="104%%">'
                 '<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="%d" result="n"/>'
                 '<feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/>'
                 '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="g"/>'
                 '<feColorMatrix in="g" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.10 0" result="gr"/>'
                 '<feComposite in="gr" in2="d" operator="in" result="gm"/>'
                 '<feBlend in="gm" in2="d" mode="overlay"/>'
                 '</filter>') % self.rng.randint(1, 999)
        return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">'
                '<defs>%s%s%s</defs><g%s>%s</g></svg>') % (
            w, h, w, h, f, extra_defs, "".join(self.defs),
            ' filter="url(#paint)"' if filt else "", "".join(self.body))
