"""Download the three CC0 aerial photographs from Wikimedia Commons,
grade them like the rest of the set and write AVIF + WebP sizes to
Website/Assets/photos/{edge,canopy,ridge}-<width>.{avif,webp}.

Until this has run, those files hold stand-ins cut from photos that
are already on the site (see CREDITS.md). Run it once, look at the
result, then commit the images and remove the "stand-in" notes from
CREDITS.md.

    pip install pillow          # Pillow 11+ writes AVIF
    python tools/fetch_aerial.py

Wikimedia rate-limits scripted downloads. If you get HTTP 429, wait
a few minutes and run it again; finished photos are skipped.
"""
import io, os, sys, time, urllib.request
from PIL import Image, ImageEnhance, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Website", "Assets", "photos")
UA = "PortfolioAssetFetcher/1.0 (one-off download of three CC0 photographs)"
BASE = "https://upload.wikimedia.org/wikipedia/commons/"
PHOTOS = {
    # name: (Commons path, output widths)
    "edge":   ("4/44/Forest_clearing_from_above_%28Unsplash%29.jpg", [960, 1600, 2400]),
    "canopy": ("3/34/Aerial_view_of_a_forest_%28Unsplash%29.jpg",   [960, 1600]),
    "ridge":  ("0/0a/Forest_clearing_from_above_1_%28Unsplash%29.jpg", [960, 1600]),
}

def grade(im):
    """Slightly desaturated, forest-teal shadows, warm highlights."""
    im = ImageEnhance.Color(im).enhance(0.84)
    im = ImageEnhance.Contrast(im).enhance(1.04)
    lum = ImageOps.grayscale(im)
    shadows = ImageOps.invert(lum).point(lambda v: int(v * 0.16))
    highs = lum.point(lambda v: int(max(0, v - 110) * 0.22))
    im = Image.composite(Image.new("RGB", im.size, (23, 58, 48)), im, shadows)
    return Image.composite(Image.new("RGB", im.size, (243, 220, 176)), im, highs)

def fetch(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

done_marker = os.path.join(ROOT, ".aerial-fetched")
done = set(open(done_marker).read().split()) if os.path.exists(done_marker) else set()
for name, (path, widths) in PHOTOS.items():
    if name in done:
        print(f"{name}: already fetched"); continue
    try:
        data = fetch(path)
    except Exception as e:  # noqa: BLE001
        print(f"{name}: {e}. Try again in a few minutes."); continue
    src = grade(Image.open(io.BytesIO(data)).convert("RGB"))
    for w in widths:
        h = round(src.height * w / src.width)
        im = src.resize((w, h), Image.LANCZOS)
        im.save(os.path.join(ROOT, f"{name}-{w}.webp"), "WEBP", quality=74, method=6)
        im.save(os.path.join(ROOT, f"{name}-{w}.avif"), "AVIF", quality=52, speed=4)
        print(f"{name}-{w}: {w}x{h}")
    with open(done_marker, "a") as f:
        f.write(name + "\n")
    time.sleep(5)
