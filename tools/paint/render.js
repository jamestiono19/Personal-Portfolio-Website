// Rasterise the painted SVG layers with headless Chromium.
// Usage: node tools/paint/render.js IN_DIR OUT_DIR name[:w:h] ...
// Each SVG is drawn at its own size on a transparent page and saved as PNG.
// tools/paint/encode.py then writes the WebP and AVIF sizes the site uses.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const [inDir, outDir, ...names] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const spec of names) {
    const [name, w = "2400", h = "1350"] = spec.split(":");
    const page = await browser.newPage({ viewport: { width: +w, height: +h } });
    const svg = fs.readFileSync(path.join(inDir, `${name}.svg`), "utf8");
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, `${name}.png`), omitBackground: true });
    await page.close();
    console.log("rendered", name);
  }
  await browser.close();
})();
