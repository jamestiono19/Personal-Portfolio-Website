"""Give the rendered layers a painted surface and write the site files.

For each PNG: an oil-paint pass (OpenCV xphoto) breaks flat fills into
brush-sized patches, a faint canvas weave is laid over the colour, and
the result is written as WebP and AVIF at each width.

Usage: python tools/paint/encode.py PNG_DIR OUT_DIR name:w1,w2[:noalpha] ...
"""

import os
import sys

import cv2
import numpy as np
from PIL import Image


def painterly(rgba, size=7, ratio=1):
    a = rgba[..., 3:4].astype(np.float32) / 255.0
    rgb = rgba[..., :3].astype(np.float32)
    # Fill transparent pixels with nearby colour so edges don't pick up black.
    bg = cv2.blur(rgb * a, (25, 25)) / np.maximum(cv2.blur(a, (25, 25))[..., None], 1e-3)
    rgb = rgb * a + bg * (1 - a)
    bgr = cv2.cvtColor(np.clip(rgb, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    oil = cv2.xphoto.oilPainting(bgr, size, ratio)
    out = cv2.cvtColor(oil, cv2.COLOR_BGR2RGB).astype(np.float32)
    # Canvas weave: fine directional noise, very low amplitude.
    h, w = out.shape[:2]
    rng = np.random.default_rng(7)
    n = rng.normal(0, 1, (h, w)).astype(np.float32)
    weave = cv2.GaussianBlur(n, (0, 0), sigmaX=2.2, sigmaY=0.6) * 0.6 + cv2.GaussianBlur(n, (0, 0), sigmaX=0.6, sigmaY=2.2) * 0.6
    out += weave[..., None] * 6.0
    # Soften the alpha edge a touch so layers sit into each other.
    alpha = cv2.GaussianBlur(rgba[..., 3], (3, 3), 0)
    return np.dstack([np.clip(out, 0, 255).astype(np.uint8), alpha])


def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    for spec in sys.argv[3:]:
        parts = spec.split(":")
        name, widths = parts[0], [int(w) for w in parts[1].split(",")]
        alpha = not (len(parts) > 2 and parts[2] == "noalpha")
        size = int(parts[3]) if len(parts) > 3 else 7
        im = np.array(Image.open(os.path.join(src, name + ".png")).convert("RGBA"))
        im = painterly(im, size=size)
        base = Image.fromarray(im, "RGBA")
        if not alpha:
            base = base.convert("RGB")
        for w in widths:
            h = round(base.height * w / base.width)
            r = base.resize((w, h), Image.LANCZOS)
            r.save(os.path.join(out, "%s-%d.webp" % (name, w)), quality=80, method=6)
            r.save(os.path.join(out, "%s-%d.avif" % (name, w)), quality=58, speed=5)
        base.save(os.path.join(out, "%s-full.png" % name))
        print("encoded", name, widths)


if __name__ == "__main__":
    main()
