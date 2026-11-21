# Credits

## Photographs

All photographs come from Wikimedia Commons. Four are under Creative Commons attribution licences and three are CC0 (public domain dedication, originally published on Unsplash before its licence change). Each was resized, colour-graded toward teal shadows and warm highlights, and re-encoded as AVIF/WebP for this site. No share-alike licence applies to any of them. Credit is given for the CC0 images too, although it is not required.

| Used as | Files on this site | Title | Author | Source | Licence |
|---|---|---|---|---|---|
| Hero, the forest below the intro canopy, OG image | `Website/Assets/photos/path-*`, `Website/Assets/og-cover.jpg` | Walking on a misty forest path at Višňevnik | Dreamy Pixel | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Walking_on_a_misty_forest_path_at_Vi%C5%A1evnik.jpg) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Background (pre-dawn layer), footer | `Website/Assets/photos/valley-*` | Foggy morning - PNN Valle de Cocora, Colombia | Giulian Frisoni | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Foggy_morning_-_PNN_Valle_de_Cocora,_Colombia.jpg) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Background (morning layer) | `Website/Assets/photos/rays-*` | Light Through The Fog (59596778) | Donnie Nunley | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Light_Through_The_Fog_(59596778).jpeg) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| Quote tile, cover setting | `Website/Assets/photos/moss-*` | Macro Rock Moss (14707027090) | Cory Denton from Saskatoon | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Macro_Rock_Moss_(14707027090).jpg) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Statement section (forest meeting dry ground, from above) | `Website/Assets/photos/edge-*` | Forest clearing from above (Unsplash) | Nathan Anderson | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Forest_clearing_from_above_(Unsplash).jpg), originally [Unsplash](https://unsplash.com/photos/njvQ5sQQUwU) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Intro canopy that parts | `Website/Assets/photos/canopy-*` | Aerial view of a forest (Unsplash) | Ozark Drones | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Aerial_view_of_a_forest_(Unsplash).jpg), originally [Unsplash](https://unsplash.com/photos/rkvI-ToeV40) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Record section photo | `Website/Assets/photos/ridge-*` | Forest clearing from above 1 (Unsplash) | Anton Gudkov | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Forest_clearing_from_above_1_(Unsplash).jpg), originally [Unsplash](https://unsplash.com/photos/LuiPhkR3Mas) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

### Stand-ins until `tools/fetch_aerial.py` is run

The three CC0 aerial photographs above were chosen and their licences checked, but Wikimedia rate-limited the download from this machine. Until `python tools/fetch_aerial.py` has been run, the `edge-*`, `canopy-*` and `ridge-*` files are crops of photographs already credited here:

| Files | Currently cut from | Becomes |
|---|---|---|
| `edge-*` | Foggy morning, PNN Valle de Cocora (Giulian Frisoni, CC BY 2.0) | Forest clearing from above (Nathan Anderson, CC0) |
| `canopy-*` | Macro Rock Moss (Cory Denton, CC BY 2.0) | Aerial view of a forest (Ozark Drones, CC0) |
| `ridge-*` | Light Through The Fog (Donnie Nunley, CC BY 3.0) | Forest clearing from above 1 (Anton Gudkov, CC0) |

Direct files: [edge](https://upload.wikimedia.org/wikipedia/commons/4/44/Forest_clearing_from_above_%28Unsplash%29.jpg), [canopy](https://upload.wikimedia.org/wikipedia/commons/3/34/Aerial_view_of_a_forest_%28Unsplash%29.jpg), [ridge](https://upload.wikimedia.org/wikipedia/commons/0/0a/Forest_clearing_from_above_1_%28Unsplash%29.jpg). Delete this subsection once the script has run.

## Project images

Project covers and charts are my own work, exported from each project's real outputs:

- `traffic-scenarios.webp`, `traffic-learning.webp`: `results/figures` in the adaptive-traffic-light-drl repository.
- `textmining-*.webp`: result figures from the Text Mining final project notebooks.
- `bodyfat-abdomen.webp`: EDA artifacts of the Body Fat project.
- `datafest-outreach.webp`, `Datafest.webp`: ASA DataFest 2026 notebooks.
- `commonground-*.webp`: screenshots of the live CommonGround demo.
- `Ecorangers`, `Matcha`, `Linkvestor`, `Bodyfat`, `Hero` images: carried over from the previous version of this site. The LinkVestor highlights are read from the project board shown in `Linkvestor.png`.

## Typefaces

Instrument Serif, Hanken Grotesk and IBM Plex Mono, served by Google Fonts under the SIL Open Font License 1.1.

## Code

Smooth scrolling uses [Lenis](https://github.com/darkroomengineering/lenis) (MIT), loaded from jsDelivr on desktop only.
