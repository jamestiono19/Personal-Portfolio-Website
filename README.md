# James Tiono, portfolio

A data-focused portfolio set in a painted medieval market town. Static HTML, CSS and vanilla JavaScript modules, no build step. Deployed on Vercel from `Website/`.

Live: https://jamestiono-porto.vercel.app/

## Run it locally

ES modules don't load from `file://`, so serve the folder:

```bash
cd Website
python3 -m http.server 8000      # then open http://localhost:8000
```

The intro (a castle gate: the portcullis rises with real loading progress, the doors swing open and the camera moves through into the market lane) plays once per browser session and takes about 3 s after the visitor enters. A Skip intro button is always visible. Add `?intro` to the URL to force it, or `?nointro` to skip it. With reduced motion it is a short fade.

## Check it

```bash
node tools/check.mjs
```

Parses every module and validates `scripts/projects.js` and `scripts/credentials.js`: known categories, no empty fields, a source on every highlight, alt text on every image, and every cover and chart file present. It also resolves every local `src`, `href`, `srcset` and `url()`, and checks that every `data-hl` figure quoted outside the Work section points at a real highlight, and that no banned typeface, CDN font or middle-dot string has crept back in. Run it before every push.

## Layout

```
Website/
  index.html            sections, the castle gate, and the static copy
  styles/
    tokens.css          fonts (self-hosted), palette, category heraldry, type scale, space
    site.css            materials and sections, the gate, responsive and reduced-motion rules
  scripts/
    projects.js         THE project data (typed with JSDoc): boards, filters, counters,
                        the featured sign and the footer list all render from it
    credentials.js      every certificate and record, with ID, date and source file
    render.js           builds boards, filters, counters and credentials from the data
    motion.js           gate, parallax, bunting sway, statement lighting, cover reveal, cursor
    app.js              entry point: render, navigation, contact letter (mailto), motion
    vendor/             GSAP and Lenis, self-hosted ES modules
  Assets/
    scene/              painted layers (AVIF + WebP at 960/1600/2400 w), see CREDITS.md
    fonts/              WOFF2 files
    logos/              provider logos with a clear licence
    projects/           real outputs and screenshots from each project
tools/
  check.mjs             the pre-push check described above
  paint/                the generators for every painted image (bash tools/paint/build.sh)
docs/
  iteration-3-plan.md   audit, tokens, type roles, text-role map, gate timeline
```

## Adding a project

Add one entry to `PROJECTS` in `Website/scripts/projects.js`. Every highlight needs a `source`: the file, notebook, run or page the figure came from. Counts, filter tabs, the hero figures and the footer list update on their own. To quote a highlight elsewhere on the page, use `data-hl="slug:Label"` (value) or `data-hl-src="slug:Label"` (source).

## Data rule

Every figure on the site was read from the project's own files or live page. Nothing is estimated or rounded up. If a figure can't be traced to a source, it doesn't go on the site.

Anything that could not be traced to a source is listed in `NEEDS_CONFIRMATION.md`.
