"""
paint_scenery.py — procedurally paints every nature image the site uses.

No stock photography is involved: each image is generated here from
noise, gradients and simple shapes, so the whole set is original work
and ships under the repository's own terms (see CREDITS.md).

    python3 tools/paint_scenery.py            # writes Website/Assets/scenery/*

Outputs (each as WebP + AVIF at several widths, plus a JPEG fallback
for the large scenes):

    ridge     misty forest ridges at sunrise           (bento, highlights, OG)
    canopy    looking up through leaves into the dawn  (bento, highlights)
    river     aerial forest valley with a gold river   (stack, footer)
    gate      foliage wall with an arched doorway      (intro, landscape)
    gate-p    the same doorway, portrait               (intro, phones)
    treeline-far / treeline-near   SVG masks for the sticky parallax scene
                                   (inlined into css/scene.css)

Re-running with the same SEED reproduces the same images.
"""
from __future__ import annotations

import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SEED = 2026
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "Website", "Assets", "scenery")

# Palette, kept in step with css/tokens.css
NIGHT = (6, 26, 23)
CANOPY = (14, 52, 44)
TEAL = (29, 84, 80)
GOLD = (244, 182, 90)
AMBER = (232, 131, 74)
PEACH = (246, 201, 168)
MIST = (244, 237, 226)
LEAF = (143, 208, 94)


# ── helpers ────────────────────────────────────────────────────────────
def rng(offset: int = 0) -> np.random.Generator:
    return np.random.default_rng(SEED + offset)


def lerp(a, b, t):
    a = np.asarray(a, dtype=np.float32)
    b = np.asarray(b, dtype=np.float32)
    return a + (b - a) * t


def noise1d(n: int, octaves: int, r: np.random.Generator, base: int = 6, persistence=0.55):
    """Fractal value noise in [-1, 1] sampled at n points."""
    out = np.zeros(n, dtype=np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        k = base * (2 ** o) + 1
        pts = r.uniform(-1, 1, k)
        x = np.linspace(0, k - 1, n)
        i = np.floor(x).astype(int).clip(0, k - 2)
        f = x - i
        f = f * f * (3 - 2 * f)
        out += amp * (pts[i] * (1 - f) + pts[i + 1] * f)
        total += amp
        amp *= persistence
    return out / total


def noise2d(h: int, w: int, scale: int, r: np.random.Generator, octaves=4):
    """Cheap fractal value noise in [0, 1] via upscaled random grids."""
    acc = np.zeros((h, w), dtype=np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        gh = max(2, h // (scale >> o or 1))
        gw = max(2, w // (scale >> o or 1))
        g = Image.fromarray((r.uniform(0, 255, (gh, gw))).astype(np.uint8))
        g = np.asarray(g.resize((w, h), Image.BICUBIC), dtype=np.float32) / 255.0
        acc += amp * g
        total += amp
        amp *= 0.5
    return acc / total


def to_img(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def add_grain(arr: np.ndarray, r: np.random.Generator, amount=5.0):
    g = r.normal(0, amount, arr.shape[:2]).astype(np.float32)[..., None]
    return arr + g


def vignette(arr: np.ndarray, strength=0.35):
    h, w = arr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    v = 1 - strength * np.clip(d - 0.55, 0, 1) ** 1.4
    return arr * v[..., None]


def leaf_poly(cx, cy, length, width, angle):
    """A pointed leaf (lens shape, fuller towards the stem) as a polygon.

    `length` is the half-length, `width` the half-width."""
    ca, sa = math.cos(angle), math.sin(angle)
    pts = []
    us = np.linspace(0, 1, 12)
    for side in (1, -1):
        for u in (us if side == 1 else us[::-1]):
            x = length * (2 * u - 1)
            y = side * width * math.sin(math.pi * u ** 0.85)
            pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return pts


# ── 1. ridge: layered misty ridges at sunrise ──────────────────────────
def paint_ridge(W=2400, H=1500):
    r = rng(1)
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    xx = np.linspace(0, 1, W, dtype=np.float32)[None, :]

    # Sky: pre-dawn teal at the top, amber band, peach haze at the horizon.
    top, mid, low = np.array((22, 58, 66)), np.array(AMBER), np.array(PEACH)
    t = np.clip(yy / 0.55, 0, 1)
    sky = np.where(t[..., None] < 0.6,
                   lerp(top, mid, (t / 0.6)[..., None] ** 1.6),
                   lerp(mid, low, ((t - 0.6) / 0.4)[..., None]))
    sky = np.broadcast_to(sky, (H, W, 3)).copy()

    # Sun and its bloom.
    sx, sy = 0.63, 0.47
    d = np.sqrt(((xx - sx) * W / H) ** 2 + (yy - sy) ** 2)
    sky += (np.exp(-(d / 0.035) ** 2)[..., None] * np.array((255, 245, 220)) * 0.95)
    sky += (np.exp(-(d / 0.22) ** 2)[..., None] * np.array(GOLD) * 0.55)
    sky += (np.exp(-(d / 0.6) ** 2)[..., None] * np.array(AMBER) * 0.18)

    # God rays: angular noise falling off with distance from the sun.
    ang = np.arctan2(yy - sy, (xx - sx) * W / H)
    rays_n = noise1d(720, 3, r, base=40)
    idx = ((ang + math.pi) / (2 * math.pi) * 719).astype(int)
    rays = (np.clip(rays_n[idx], 0, 1) ** 2) * np.exp(-d / 0.55)
    img = sky + rays[..., None] * np.array(GOLD) * 0.35

    haze = np.array((238, 196, 160), dtype=np.float32)
    far_col = np.array((150, 120, 118), dtype=np.float32)
    near_col = np.array(NIGHT, dtype=np.float32)
    layers = 7
    cols = np.arange(W)
    for k in range(layers):
        f = k / (layers - 1)
        base = 0.50 + 0.36 * f ** 1.15
        amp = 0.05 + 0.07 * (1 - f)
        ridge = base - amp * (0.5 + 0.5 * noise1d(W, 5, r, base=3 + k))
        top_px = ridge * H
        # Conifers on the nearer ridges.
        if k >= 2:
            prof = np.zeros(W, dtype=np.float32)
            x = 0.0
            hmax = 8 + 46 * f ** 1.3
            while x < W:
                h = r.uniform(0.45, 1.0) * hmax
                w = h * r.uniform(0.18, 0.28)
                xc = int(x)
                lo, hi = max(0, int(xc - w)), min(W, int(xc + w) + 1)
                seg = h * (1 - np.abs(cols[lo:hi] - xc) / w)
                jag = 1 + 0.12 * np.sin(cols[lo:hi] * 1.7)
                prof[lo:hi] = np.maximum(prof[lo:hi], seg * jag)
                x += r.uniform(0.35, 0.9) * w * 2
            top_px = top_px - prof
        mask = (np.arange(H)[:, None] >= top_px[None, :]).astype(np.float32)
        # Soften the silhouette edge slightly on far layers.
        mimg = Image.fromarray((mask * 255).astype(np.uint8))
        mimg = mimg.filter(ImageFilter.GaussianBlur(2.2 * (1 - f) + 0.4))
        mask = np.asarray(mimg, dtype=np.float32)[..., None] / 255.0
        col = lerp(far_col, near_col, f ** 0.8)
        # Rim light where the sun grazes the ridge.
        shade = np.broadcast_to(col, (H, W, 3)).copy()
        depth = np.clip((np.arange(H)[:, None] - top_px[None, :]) / (H * 0.08), 0, 1)
        shade = lerp(shade, haze * 0.75 + col * 0.25, (1 - depth)[..., None] * 0.25 * (1 - f))
        img = img * (1 - mask) + shade * mask
        # Mist band that settles in front of this ridge.
        band_y = base + 0.02
        band = np.exp(-((yy - band_y) / (0.035 + 0.02 * f)) ** 2)
        wisp = 0.55 + 0.45 * noise2d(H, W, 220, r, octaves=3)
        a = np.clip(band * wisp * (0.75 - 0.5 * f), 0, 1)[..., None]
        img = img * (1 - a) + haze * a

    img = vignette(img, 0.4)
    img = add_grain(img, r, 4)
    return to_img(img)


# ── 2. canopy: looking up through leaves into the dawn ────────────────
def paint_canopy(W=1800, H=2200):
    r = rng(2)
    S = 2  # supersample for clean leaf edges
    w2, h2 = W // S, H // S
    yy = np.linspace(0, 1, h2, dtype=np.float32)[:, None]
    xx = np.linspace(0, 1, w2, dtype=np.float32)[None, :]
    cx, cy = 0.56, 0.42
    d = np.sqrt(((xx - cx) * w2 / h2) ** 2 + (yy - cy) ** 2)
    sky = lerp(np.array((255, 246, 222)), np.array((150, 196, 205)), np.clip(d / 0.7, 0, 1)[..., None])
    sky = lerp(sky, np.array(PEACH), (np.exp(-(d / 0.35) ** 2) * 0.35)[..., None])
    sky += np.exp(-(d / 0.06) ** 2)[..., None] * 60
    base = to_img(sky).resize((W, H), Image.BICUBIC).convert("RGBA")

    def leaf_layer(n, size, dark, light, blur, density_pow, seed):
        rr = rng(seed)
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        dr = ImageDraw.Draw(lay)
        placed = 0
        while placed < n:
            x, y = rr.uniform(-0.05, 1.05), rr.uniform(-0.05, 1.05)
            dd = math.hypot((x - cx) * W / H, y - cy)
            if rr.uniform() > min(1, (dd / 0.62) ** density_pow):
                continue
            placed += 1
            L = rr.uniform(*size) * W
            ang = math.atan2(y - cy, x - cx) + rr.normal(0, 0.9)
            # Leaves nearer the light are back-lit (yellow-green, translucent).
            lit = max(0.0, 1 - dd / 0.75) ** 1.5
            col = lerp(dark, light, min(1, lit * rr.uniform(0.6, 1.4))).astype(int)
            alpha = int(255 * rr.uniform(0.82, 1.0))
            dr.polygon(leaf_poly(x * W, y * H, L, L * rr.uniform(0.32, 0.45), ang), fill=(*col, alpha))
        if blur:
            lay = lay.filter(ImageFilter.GaussianBlur(blur))
        return lay

    # Branches reaching in from the corners.
    br = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(br)
    for _ in range(9):
        side = r.integers(4)
        sx = [0, W, r.uniform(0, W), r.uniform(0, W)][side]
        sy = [r.uniform(0, H), r.uniform(0, H), 0, H][side]
        ex, ey = cx * W + r.normal(0, W * 0.18), cy * H + r.normal(0, H * 0.18)
        steps = 40
        for i in range(steps):
            t0, t1 = i / steps, (i + 1) / steps
            if t1 > r.uniform(0.55, 0.8):
                break
            wob = math.sin(t0 * 7 + _) * 30
            p0 = (sx + (ex - sx) * t0 + wob, sy + (ey - sy) * t0)
            p1 = (sx + (ex - sx) * t1 + wob, sy + (ey - sy) * t1)
            bd.line([p0, p1], fill=(36, 30, 22, 255), width=max(2, int(26 * (1 - t0))))
    br = br.filter(ImageFilter.GaussianBlur(1.2))

    far = leaf_layer(2600, (0.012, 0.03), np.array((60, 96, 70)), np.array((205, 226, 140)), 3.0, 1.2, 21)
    mid = leaf_layer(2600, (0.02, 0.045), np.array((24, 62, 44)), np.array((170, 214, 92)), 1.0, 1.7, 22)
    near = leaf_layer(900, (0.045, 0.09), np.array((8, 30, 22)), np.array((120, 170, 60)), 0, 2.6, 23)

    img = Image.alpha_composite(base, far)
    img = Image.alpha_composite(img, br)
    img = Image.alpha_composite(img, mid)
    img = Image.alpha_composite(img, near)
    arr = np.asarray(img.convert("RGB"), dtype=np.float32)
    # Bloom from the sun through the gaps.
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    xx = np.linspace(0, 1, W, dtype=np.float32)[None, :]
    d = np.sqrt(((xx - cx) * W / H) ** 2 + (yy - cy) ** 2)
    arr += np.exp(-(d / 0.16) ** 2)[..., None] * np.array(GOLD) * 0.35
    arr = vignette(arr, 0.3)
    arr = add_grain(arr, r, 3.5)
    return to_img(arr)


# ── 3. river: aerial forest valley with a gold river ──────────────────
def crown_sprite(radius: int, color, light_dir=(0.6, -0.7)):
    s = radius * 2 + 6
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    c = s / 2
    d = np.sqrt((xx - c) ** 2 + (yy - c) ** 2) / radius
    alpha = np.clip((1 - d) * 4, 0, 1)
    lx, ly = light_dir
    shade = 0.55 + 0.6 * np.clip(((xx - c) * lx + (yy - c) * ly) / radius, -1, 1) * 0.5
    shade *= 1 - 0.35 * d ** 2
    col = np.asarray(color, dtype=np.float32)[None, None, :] * shade[..., None]
    rgba = np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def paint_river(W=2400, H=1400):
    r = rng(3)
    ground = np.zeros((H, W, 3), dtype=np.float32) + np.array((10, 34, 26))
    img = to_img(ground).convert("RGBA")

    # River centre line and width.
    xs = np.arange(W)
    centre = H * (0.56 + 0.16 * np.sin(xs / W * 2.1 * math.pi + 0.6) + 0.12 * noise1d(W, 4, r, base=3))
    width = 18 + 16 * (0.5 + 0.5 * noise1d(W, 2, r, base=3))

    # Tree crowns: many shaded discs, skipping the river and its banks.
    palette = [(22, 70, 44), (30, 86, 50), (44, 102, 54), (18, 58, 40), (58, 112, 58), (70, 98, 40)]
    sprites = {}
    n = 16000
    pts_x = r.uniform(-20, W + 20, n)
    pts_y = r.uniform(-20, H + 20, n)
    order = np.argsort(pts_y)
    for i in order:
        x, y = pts_x[i], pts_y[i]
        xi = int(np.clip(x, 0, W - 1))
        if abs(y - centre[xi]) < width[xi] * 1.25 + 6:
            continue
        rad = int(r.uniform(9, 22))
        ci = int(r.integers(len(palette)))
        key = (rad, ci)
        if key not in sprites:
            sprites[key] = crown_sprite(rad, palette[ci])
        sp = sprites[key]
        img.alpha_composite(sp, (int(x - sp.width / 2), int(y - sp.height / 2))) if 0 <= int(x - sp.width / 2) and 0 <= int(y - sp.height / 2) and int(x + sp.width / 2) < W and int(y + sp.height / 2) < H else None
    arr = np.asarray(img.convert("RGB"), dtype=np.float32)

    # The river reflects the sunrise sky.
    yy = np.arange(H, dtype=np.float32)[:, None]
    dist = np.abs(yy - centre[None, :]) / width[None, :]
    water = np.clip((1.0 - dist) * 3, 0, 1)
    water = np.asarray(Image.fromarray((water * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5)), dtype=np.float32) / 255
    along = (xs / W)[None, :]
    wcol = lerp(np.array((120, 150, 150)), np.array(GOLD), (along ** 1.5)[..., None])
    ripple = 0.85 + 0.15 * noise2d(H, W, 30, r, octaves=2)[..., None]
    bank = np.clip((1.45 - dist) * 2, 0, 1) * (1 - water)
    arr = arr * (1 - bank[..., None] * 0.6) + np.array((92, 110, 66)) * bank[..., None] * 0.6
    arr = arr * (1 - water[..., None]) + wcol * ripple * water[..., None]

    # Morning light from the upper right, mist over the water.
    xx = np.linspace(0, 1, W, dtype=np.float32)[None, :]
    yn = yy / H
    glow = np.exp(-(((xx - 1.0) ** 2) / 0.35 + (yn ** 2) / 0.25))
    arr += glow[..., None] * np.array(GOLD) * 0.45
    mist = np.exp(-(dist / 2.2) ** 2) * (0.15 + 0.35 * noise2d(H, W, 180, r, octaves=3))
    arr = arr * (1 - mist[..., None] * 0.35) + np.array(MIST) * mist[..., None] * 0.35
    arr = vignette(arr, 0.45)
    arr = add_grain(arr, r, 3)
    return to_img(arr)


# ── 4. gate: foliage wall with an arched doorway ──────────────────────
def paint_gate(W, H, arch_w, arch_top, seed):
    """RGBA: opaque foliage everywhere except the arch, which is clear."""
    r = rng(seed)
    S = 1
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx = W / 2
    rad = arch_w / 2
    spring = arch_top + rad  # where the semicircle meets the jambs
    inside = ((np.abs(xx - cx) <= rad) & (yy >= spring)) | (((xx - cx) ** 2 + (yy - spring) ** 2) <= rad ** 2)
    # Distance outside the arch, for the warm rim light.
    dist_out = np.where(yy >= spring, np.abs(xx - cx) - rad, np.sqrt((xx - cx) ** 2 + (yy - spring) ** 2) - rad)

    base = np.zeros((H, W, 3), dtype=np.float32) + np.array(NIGHT)
    rim = np.exp(-np.clip(dist_out, 0, None) / (W * 0.05))
    base += rim[..., None] * np.array(AMBER) * 0.25
    img = to_img(base).convert("RGBA")
    dr = ImageDraw.Draw(img)

    def outside(px, py):
        if 0 <= int(py) < H and 0 <= int(px) < W:
            return not inside[int(py), int(px)]
        return True

    for layer, (count, size, dark, light) in enumerate([
        (5200, (0.012, 0.028), (12, 40, 34), (44, 92, 64)),
        (3600, (0.018, 0.04), (8, 32, 26), (70, 120, 70)),
        (1500, (0.03, 0.06), (5, 22, 18), (120, 150, 70)),
    ]):
        placed = 0
        while placed < count:
            x, y = r.uniform(-0.05, 1.05) * W, r.uniform(-0.05, 1.05) * H
            if not outside(x, y):
                continue
            placed += 1
            L = r.uniform(*size) * max(W, H)
            dd = dist_out[int(np.clip(y, 0, H - 1)), int(np.clip(x, 0, W - 1))]
            lit = math.exp(-max(dd, 0) / (W * 0.06))
            col = lerp(np.array(dark), np.array(light), min(1, lit * r.uniform(0.4, 1.3)))
            col = lerp(col, np.array(GOLD), lit * 0.35 * r.uniform(0, 1)).astype(int)
            ang = r.uniform(0, math.pi * 2)
            dr.polygon(leaf_poly(x, y, L, L * r.uniform(0.3, 0.45), ang), fill=(*col, 255))

    arr = np.asarray(img, dtype=np.float32).copy()
    # Leaves may overhang the arch edge a little, then the opening is cleared.
    clear = inside & (np.asarray(Image.fromarray((inside * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9))) > 0)
    noise = noise2d(H, W, 40, r, octaves=2)
    clear = clear | (inside & (noise > 0.45))
    a = np.where(clear, 0, 255).astype(np.uint8)
    a = np.asarray(Image.fromarray(a).filter(ImageFilter.GaussianBlur(1.2)))
    arr[..., 3] = a
    rgb = add_grain(arr[..., :3], r, 3)
    arr[..., :3] = rgb
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


# ── 5. treeline masks for the parallax scene ──────────────────────────
def paint_treeline(W, H, hmax, spacing, seed, ridge_amp, as_svg=False):
    r = rng(seed)
    cols = np.arange(W)
    ridge = H * (0.55 - ridge_amp * (0.5 + 0.5 * noise1d(W, 4, r, base=3)))
    prof = np.zeros(W, dtype=np.float32)
    x = 0.0
    while x < W:
        h = r.uniform(0.4, 1.0) * hmax
        w = h * r.uniform(0.17, 0.26)
        xc = int(x)
        lo, hi = max(0, int(xc - w)), min(W, int(xc + w) + 1)
        seg = h * (1 - np.abs(cols[lo:hi] - xc) / w)
        prof[lo:hi] = np.maximum(prof[lo:hi], seg)
        x += r.uniform(*spacing) * w
    top = ridge - prof
    if as_svg:
        # Vector version for CSS masks: tiny, and paints with the CSS.
        xs = list(range(0, W, 3)) + [W - 1]
        pts = " ".join(f"{x} {int(round(top[x]))}" for x in xs)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
                f'<path d="M0 {H}L{pts}L{W} {H}Z"/></svg>')
    a = (np.arange(H)[:, None] >= top[None, :]).astype(np.uint8) * 255
    a = np.asarray(Image.fromarray(a).filter(ImageFilter.GaussianBlur(0.8)))
    rgba = np.dstack([np.full((H, W), 255, np.uint8)] * 3 + [a])
    return Image.fromarray(rgba, "RGBA")


# ── export ─────────────────────────────────────────────────────────────
def export(img: Image.Image, name: str, widths, jpeg=False, q=74, avif=True):
    os.makedirs(OUT, exist_ok=True)
    for w in widths:
        h = round(img.height * w / img.width)
        im = img.resize((w, h), Image.LANCZOS) if w != img.width else img
        im.save(os.path.join(OUT, f"{name}-{w}.webp"), "WEBP", quality=q, method=6)
        if avif:
            im.save(os.path.join(OUT, f"{name}-{w}.avif"), "AVIF", quality=max(40, q - 26))
        if jpeg and w == widths[-1]:
            im.convert("RGB").save(os.path.join(OUT, f"{name}.jpg"), "JPEG", quality=80, optimize=True, progressive=True)
    print(f"  {name}: {img.width}x{img.height} → {widths}")


def main():
    which = set(sys.argv[1:])
    want = lambda k: not which or k in which
    print("Painting scenery into", OUT)
    if want("ridge"):
        export(paint_ridge(), "ridge", [640, 1280, 1920])
    if want("canopy"):
        export(paint_canopy(), "canopy", [480, 960, 1440])
    if want("river"):
        export(paint_river(), "river", [640, 1280, 1920])
    if want("gate"):
        g = paint_gate(2000, 1250, 560, 260, 41)
        gp = paint_gate(1100, 2000, 560, 560, 42)
        export(g, "gate", [1280, 2000], q=70, avif=False)  # WebP only: matches the preload
        export(gp, "gate-p", [720, 1100], q=70, avif=False)
        # Pre-blurred copies: the intro cross-fades to these mid-dolly to
        # fake motion blur with opacity alone (no CSS filter animation).
        for name, im in (("gate-blur", g), ("gate-p-blur", gp)):
            small = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
            small.filter(ImageFilter.GaussianBlur(10)).save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=60, method=6)
            print(f"  {name}")
    if want("treeline"):
        # Treeline silhouettes as SVG. css/scene.css inlines these as data
        # URIs (masks), so the scene paints without waiting on any image.
        for name, args in [("treeline-far", (2400, 420, 70, (0.5, 1.1), 51, 0.18)),
                           ("treeline-near", (2400, 520, 150, (0.6, 1.2), 52, 0.12))]:
            with open(os.path.join(OUT, f"{name}.svg"), "w") as fh:
                fh.write(paint_treeline(*args, as_svg=True))
            print(f"  {name}.svg")


if __name__ == "__main__":
    main()
