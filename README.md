# James Tiono · Portfolio

"Sunrise over living nature, built on data." A static site: HTML, CSS and vanilla JavaScript modules, no build step. Deployed on Vercel from `Website/`.

## Run it locally

ES modules don't load from `file://`, so serve the folder:

```bash
cd Website
python3 -m http.server 8000      # then open http://localhost:8000
```

The intro plays once per browser session. To see it again, open a new tab or clear `sessionStorage` (`jt-gateway`).

## Check it

```bash
node tools/check.mjs
```

Parses every module, validates `js/data/projects.js` against its schema (known categories, a source on every highlight, no figures on pending projects), confirms every cover file exists, and resolves every local `src`/`href`/`url()`.

## Layout

```
Website/
  index.html              all sections; project cards are rendered into #cases
  css/
    tokens.css            colours, type scale, radii, shadows, easing, sky stops
    base.css              reset, type, glass, pills, chips, data labels, a11y
    scene.css             fixed sunrise scene (driven by --p) + intro gateway
    sections.css          nav, hero, statement, bento, stack, work, highlights, contact, footer
    nature.css            vine borders, ornaments, orb cursor, pollen
  js/
    main.js               entry: render → UI → scene → (libs) → intro → scroll
    data/projects.js      THE project data (typed with JSDoc)
    render.js             cards, filters + counts, hero stats, footer links
    ui.js                 nav, filters, contact form (mailto), back-to-top
    motion/
      utils.js            helpers (reduced motion, loaders, seeded random)
      scene.js            scroll progress → --p on the scene
      intro.js            gateway timeline (page roll + dolly through the door)
      scroll.js           Lenis + ScrollTrigger: dolly, statement ripen, count-ups
      vines.js            growing vine borders with leaves and corner ornaments
      ambient.js          dew-drop network, light-orb cursor, pollen particles
  vendor/                 gsap, ScrollTrigger, lenis (vendored)
  fonts/                  Fraunces, Manrope, JetBrains Mono (OFL)
  Assets/
    scenery/              painted by tools/paint_scenery.py
    covers/               responsive AVIF/WebP covers, portrait, avatar
    icons/                favicon set
tools/
  paint_scenery.py        regenerates every scenery image (seeded)
  check.mjs               the "build" check
CREDITS.md                sources and licenses
```

## Add a project

Add one entry to `Website/js/data/projects.js`. The card, filter tab counts, hero "Projects"/"Domains" stats, the Work intro sentence, and the footer link all update from it. Put covers in `Website/Assets/covers/<name>-<width>.{avif,webp}` and list the widths. Every highlight needs a `source`. Use `pending: true` (no highlights) until the figures are verified.

## Repaint the scenery

```bash
pip install numpy pillow          # Pillow with AVIF support
python3 tools/paint_scenery.py    # or: ridge canopy river gate treeline
```

`treeline-*.svg` are inlined into `css/scene.css` as data URIs. If you repaint them, paste the new data URIs there.

## Motion and accessibility

- Reduced motion: no intro animation (simple fade), no smooth scroll or parallax, vines drawn static, no particles, and the animation libraries are never downloaded.
- The intro is `aria-hidden`; "Skip intro" is the first button after "Skip to content", and focusing anything on the page ends the intro.
- Decorative layers are `aria-hidden` and `pointer-events: none`.
