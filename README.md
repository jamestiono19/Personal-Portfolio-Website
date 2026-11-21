# James Tiono · Portfolio

A photographic, data-focused portfolio. Static HTML, CSS and vanilla JavaScript modules, no build step. Deployed on Vercel from `Website/`.

Live: https://jamestiono-porto.vercel.app/

## Run it locally

ES modules don't load from `file://`, so serve the folder:

```bash
cd Website
python3 -m http.server 8000      # then open http://localhost:8000
```

The intro plays once per browser session. Add `?intro` to the URL to force it, or `?nointro` to skip it.

## Check it

```bash
node tools/check.mjs
```

Parses every module and validates `scripts/projects.js`: known categories, no empty fields, a source on every highlight, alt text on every image, and every cover and chart file present. It also resolves every local `src`, `href`, `srcset` and `url()`. Run it before every push.

## Layout

```
Website/
  index.html            sections, the loading gateway, and the static copy
  styles/
    tokens.css          design tokens: palette, type scale, spacing, radii, easing
    site.css            components and sections, the gateway, responsive and reduced-motion rules
  scripts/
    projects.js         THE project data (typed with JSDoc). Cards, filters, counters,
                        the hero card and the footer list are all rendered from it
    render.js           builds the cards, filter tabs and counters from projects.js
    motion.js           gateway, reveals, parallax/dolly, light traces, cursor, tilt, Lenis
    app.js              entry point: render, navigation, contact form (mailto), motion
  Assets/
    photos/             licensed photographs (AVIF + WebP, 960/1600/2400 w), see CREDITS.md
    projects/           real outputs and screenshots from each project
tools/
  check.mjs             the pre-push check described above
```

## Adding a project

Add one entry to `PROJECTS` in `Website/scripts/projects.js`. Every highlight needs a `source`: the file, notebook, run or page the figure came from. Counts, filter tabs and the footer list update on their own.

## Data rule

Every figure on the site was read from the project's own files or live page. Nothing is estimated or rounded up. If a figure can't be traced to a source, it doesn't go on the site.
