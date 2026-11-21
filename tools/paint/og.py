"""Social preview: the market-lane layers flattened and cropped to 1200 x 630.
Usage: python tools/paint/og.py SCENE_DIR   (reads *-full.png, writes ../og-cover.jpg)"""
import os
import sys
from PIL import Image

d = sys.argv[1]
im = Image.open(os.path.join(d, "sky-full.png")).convert("RGBA")
for n in ("far", "mid", "near"):
    im.alpha_composite(Image.open(os.path.join(d, n + "-full.png")).convert("RGBA"))
w, h = im.size
ch = round(w / 1.905)
top = (h - ch) // 2
im = im.crop((0, top, w, top + ch)).resize((1200, 630), Image.LANCZOS).convert("RGB")
im.save(os.path.join(d, "..", "og-cover.jpg"), quality=84, optimize=True, progressive=True)
print("wrote og-cover.jpg")
