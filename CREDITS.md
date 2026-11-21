# Credits

## Artwork

Every painted image on the site was made for it, in code, by the generators in `tools/paint/`. No stock art, no image model, no traced or reworked reference. The two reference paintings James supplied were used for mood only and appear nowhere in the repository.

| Used as | Files | Made by |
|---|---|---|
| Hero sky, page sky | `Website/Assets/scene/sky-*` | `tools/paint/scene.py` (sky) |
| Hero: castle, domes, town gate | `Website/Assets/scene/far-*` | `tools/paint/scene.py` (far) |
| Hero: lane, far houses, people, plaza | `Website/Assets/scene/mid-*` | `tools/paint/scene.py` (mid) |
| Hero: near houses, signs, lanterns, ivy | `Website/Assets/scene/near-*` | `tools/paint/scene.py` (near) |
| Loading gate: wall, two door leaves | `Website/Assets/scene/gate-*` | `tools/paint/gate.py` |
| Footer: the town at dusk | `Website/Assets/scene/dusk-*` | `tools/paint/dusk.py` |
| Social preview | `Website/Assets/og-cover.jpg` | `tools/paint/og.py` (the hero layers, flattened) |
| Favicon and wax-seal monogram | `Website/Assets/favicon.svg`, inline in `index.html` | Outlines of J and T from Grenze Bold (OFL-1.1) |

How they are made: the scene is real one-point perspective geometry (houses, jetties, timber framing, cobbles, bunting) written as SVG, rasterised with headless Chromium (`render.js`), then given a painted surface with OpenCV's oil-paint filter and a faint canvas weave (`encode.py`). `bash tools/paint/build.sh` rebuilds all of it. The portcullis, torch flames, near bunting, hanging lanterns and birds are drawn live in the page.

## Project images

Project covers and charts are James's own work, exported from each project's real outputs:

- `traffic-scenarios.webp`, `traffic-learning.webp`: `results/figures` in the adaptive-traffic-light-drl repository.
- `textmining-*.webp`: result figures from the Text Mining final project notebooks.
- `bodyfat-abdomen.webp`: EDA artifacts of the Body Fat project.
- `datafest-outreach.webp`, `Datafest.webp`: ASA DataFest 2026 notebooks.
- `commonground-*.webp`: screenshots of the live CommonGround demo.
- `Ecorangers`, `Matcha`, `Linkvestor`, `Bodyfat`, `Hero` images: carried over from earlier versions of this site.

## Typefaces

All self-hosted as Latin-subset WOFF2 from the [Fontsource](https://fontsource.org) packages, under the [SIL Open Font License 1.1](https://openfontlicense.org).

| Face | Designer | Used for |
|---|---|---|
| Grenze Gotisch (variable) | Omnibus-Type | The headline, the name, the wordmark |
| Grenze (600, 700) | Omnibus-Type | Section and project titles, figures, the statement |
| Alegreya (400, 400 italic, 600) | Juan Pablo del Peral, Huerta Tipográfica | Reading text |
| Alegreya Sans (400, 400 italic) | Juan Pablo del Peral, Huerta Tipográfica | Captions, sources, form text |
| Alegreya Sans SC (500, 700) | Juan Pablo del Peral, Huerta Tipográfica | Labels, navigation, buttons |

## Logos

| Provider | File | Source | Licence |
|---|---|---|---|
| HackerRank | `Website/Assets/logos/hackerrank.svg` | [Simple Icons](https://simpleicons.org) 16.38.0 | CC0 1.0 for the SVG file; the mark remains HackerRank's trademark and is used only to identify the issuer of James's certificate |

Microsoft, Oracle, GreatNusa, BINUS University, Beelingua and ASA DataFest are set as names, not logos. Microsoft's and Oracle's marks have been withdrawn from Simple Icons, and no openly licensed file for the others could be confirmed from this machine, so none were drawn or copied. See `NEEDS_CONFIRMATION.md`.

## Code

- [GSAP](https://gsap.com) 3.15.1, under GSAP's standard no-charge licence. Vendored as `Website/scripts/vendor/gsap.js` and loaded only when the gate plays.
- [Lenis](https://github.com/darkroomengineering/lenis) 1.3.27, MIT. Vendored as `Website/scripts/vendor/lenis.js`, desktop only.
