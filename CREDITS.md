# Credits

Everything the site ships with, and where it came from.

## Imagery

| File(s) | Source | License |
|---|---|---|
| `Website/Assets/scenery/ridge-*`, `canopy-*`, `river-*`, `gate-*`, `treeline-*.svg` | Original. Painted procedurally by [`tools/paint_scenery.py`](tools/paint_scenery.py) from noise, gradients and simple shapes (seed `2026`, reproducible). No stock photography. | Same as this repository |
| `Website/Assets/og-sunrise.jpg` | Original. Rendered from the `ridge` painting plus the site's own type. | Same as this repository |
| `Website/Assets/icons/*` (JT leaf monogram, favicon) | Original, drawn for this site. | Same as this repository |
| `Website/Assets/Hero.jpeg` → `covers/portrait-*`, `covers/avatar-96.*` | James Tiono's own portrait (existing asset). | © James Tiono |
| `Website/Assets/Ecorangers.png`, `Matcha.png`, `Bodyfat.png`, `Linkvestor.png` → `covers/*` | James Tiono's own project screenshots and presentation boards (existing assets). | © James Tiono and project teams |
| `Website/Assets/Datafest.webp` → `covers/datafest-*` | Feature-importance chart produced by Team Penjelajah Sejarah's ASA DataFest 2026 notebooks (existing asset). | © Team Penjelajah Sejarah |
| `Website/Assets/Topography.svg` | Carried over from the previous design (used faintly on the intro page). | Same as this repository |
| Corner ornaments, vine leaf, bud (inline SVG in `index.html`) | Original, drawn for this site. | Same as this repository |
| Social icons (inline SVG in `index.html`) | Drawn after the [Feather](https://feathericons.com) icon set's shapes. | MIT |

Free-license photo hosts (Unsplash, Pexels) were not reachable from the environment the site was built in, so every nature image was painted in code instead. To swap in real photography later, keep the same file names and sizes in `Website/Assets/scenery/` and add the photographer and license here.

## Type

Self-hosted from [Fontsource](https://fontsource.org) (`Website/fonts/`).

| Font | Designer | License |
|---|---|---|
| Fraunces (variable, opsz + wght) | Undercase Type | SIL Open Font License 1.1 |
| Manrope (variable) | Mikhail Sharanda | SIL Open Font License 1.1 |
| JetBrains Mono (variable) | JetBrains | SIL Open Font License 1.1 |

## Code libraries

Vendored in `Website/vendor/` (no CDN at runtime), loaded after the page's load event.

| Library | Version | License |
|---|---|---|
| [GSAP](https://gsap.com) + ScrollTrigger | 3.13.0 | GSAP Standard License (free for all uses, including commercial, from 3.13) |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.1.13 | MIT |

## Figures

Every number on the site names its source file on the card it appears on. The project figures come from:

- **Body Fat Prediction**: [`jamestiono19/Bodyfat-app`](https://github.com/jamestiono19/Bodyfat-app): `data/bodyfat.csv`, `artifacts/model_comparison.csv`, `artifacts/eda/strong_correlations.csv`, `notebook/mlopsbodyfat.ipynb`.
- **ASA DataFest 2026**: [`jamestiono19/ASA-Datafest-Competition2026-PenjelajahSejarah`](https://github.com/jamestiono19/ASA-Datafest-Competition2026-PenjelajahSejarah): `FeatureImportanceModeling.ipynb`, `SocioEconomic-Emergency.ipynb`, `test1.ipynb` (printed notebook outputs).
- **EcoRangers, Matcha, LinkVestor**: carried over from the previous site (itch.io listing, live site, project brief).
- **Highlights section** (award, certifications, current project, GPA): `Website/Assets/James Tiono CV.pdf`.
