# Iteration 3: plan

Written before building, then revised once against `design-system.md` (changes noted at the end).

## Audit (what exists on `main`)

1. Static site in `Website/` (HTML, CSS, vanilla ES modules), no build step, deployed on Vercel. `tools/check.mjs` is the pre-push gate.
2. `scripts/projects.js` holds all eight projects with sourced highlights; filters, counters, the hero card and the footer list render from it. Kept and re-verified.
3. CV download, mailto contact form, nav, mobile menu and all outbound links work. Kept.
4. Theme to remove: forest photographs (`Assets/photos/*`, `Topography.svg`, `og-cover.jpg`), the canopy intro, glass panels, teal/bone palette, `tools/fetch_aerial.py` (no longer needed).
5. Typography to remove: Instrument Serif (banned), Hanken Grotesk, IBM Plex Mono, all loaded from Google's CDN.
6. Banned patterns in use: italic accent word in every headline, `01 · About` numbered eyebrows, `01 / 02` focus markers, middle-dot metadata (`BINUS · CS`, role strings), arrow icons appended to buttons, tracked-out mono labels.
7. Credentials are hard-coded HTML with no IDs, links or provider marks. Two real certificates were never on the site (Study2Challenge 2025 finalist, four Beelingua certificates).
8. Lenis is hotlinked from jsDelivr. It will be vendored.
9. Incomplete: no credential data file, no provider logos, OG image and favicon are forest-themed.
10. PR #6 (forest iteration) is merged, so this work starts a new branch from `main`.

## Tokens

| Token | Hex | Role |
|---|---|---|
| `--plaster` | `#E6D9BC` | Reading panels only |
| `--plaster-deep` | `#D9C8A4` | Panel edges, ruled lines |
| `--timber` | `#46301F` | Frames, brackets, text on plaster |
| `--timber-dark` | `#2E1F14` | Deep frames, desk |
| `--slate` | `#2A2723` | Stone surfaces, footer, gate |
| `--slate-deep` | `#1C1A17` | Warm near-black, never `#000` |
| `--dome-gold` | `#C8922A` | Focus rings, key figures, active filter |
| `--banner` | `#A8392B` | Banners and the wax seal |
| `--sky` | `#78A9CC` | Scene sky |
| `--ivy` | `#5D7A3A` | Category mark, foliage |
| `--lantern` | `#E39B3C` | Light sources only |

Category heraldry (one colour and one ordinary per category, used on the filter, the project tag and the project frame):

| Category | Colour | Mark |
|---|---|---|
| Analytics | sky, darkened to `#3C6A8C` | fess (horizontal band) |
| Machine Learning | banner `#A8392B` | chevron |
| Deep Learning | ivy `#5D7A3A` | pale (vertical band) |
| Text Mining | gold, darkened to `#8F6519` | bend (diagonal band) |
| App Development | timber `#6B4A30` | saltire (diagonal cross) |

## Type system

| Role | Face | Size | Weight |
|---|---|---|---|
| H1, H2, wordmark | Grenze Gotisch (variable) | `clamp(3rem, 8vw, 7.5rem)` / `clamp(2.25rem, 4.5vw, 4rem)` | 850 / 700 |
| Project titles, H3, big figures, statement | Grenze | 1.75rem / figures 2rem+ | 600 to 700 |
| Reading | Alegreya | 1.0625rem, lead 1.25rem | 400, strong 600 |
| Labels, nav, buttons | Alegreya Sans SC | 0.8125rem | 500 (labels), 700 (buttons, nav) |
| Captions, form text | Alegreya Sans | 0.8125 to 1rem | 400 |

Alegreya Sans has no 600 weight, so labels use 500 small caps and actions use 700. Figures in Grenze are checked for `tnum` and `lnum`; any face without them falls back to Alegreya for figures.

## Text-role map

| Text | Level | Treatment |
|---|---|---|
| Hero headline | 1 Declaration | Gotisch 850, left, three lines over the sky, breaks out of the content column; scrim behind |
| Section titles (About, Work, Credentials, Contact) | 1 | Gotisch 700, left; Contact title sits on the letter |
| Statement paragraph | 1 | Grenze 600, left, 22ch to 28ch measure, lights up word by word |
| Hero descriptor | 2 Narration | Alegreya lead on a plaster panel, ragged right |
| About narrative | 2 | Alegreya, 62ch, justified (it is over four lines and over 45ch), hyphenated |
| Project narration | 2 | Alegreya, ragged right, 60ch |
| Problem and solution blocks | 2 | Alegreya, ragged right, labelled with small caps |
| Hero stat strip | 3 Evidence | Figure first (Grenze, tabular), label beneath, on a stone ledger band |
| Project highlights | 3 | Ledger rows: figure right-aligned in a tabular column, then label, context, source |
| Statement ledger | 3 | Three ledger entries, figures on one baseline |
| Credential IDs and dates | 3 | Alegreya tabular lining figures in a definition list |
| Image captions, chart notes | 4 Annotation | Alegreya Sans, attached to the image's bottom edge |
| Highlight sources | 4 | Alegreya Sans italic under the row, aligned to the label column |
| Project meta (year, role, duration, status) | 4 | Definition list beside the title, not a dotted string |
| Nav, filters, buttons, links | 5 Action | Alegreya Sans SC 700, 44 px hit areas |

## Sections

| Section | Concept | Alignment |
|---|---|---|
| Hero | Street level at the end of the market lane looking to the gate; five painted layers; headline set into the sky, plaster descriptor panel lower left, featured project hangs as a shop sign on an iron bracket right | Left, asymmetric |
| Statement | Stone band with carved-timber rules; one declaration that lights like lanterns; three ledger entries beside it | Left, 7/5 split |
| About | Open book on a timber desk: portrait page left with iron corner brackets, narrative and facts right, quote as a marginal inscription | Two pages, text left-aligned |
| Work | Guild hall wall. Header and cloth filter banners, then eight project boards; three board layouts in rotation so no layout repeats more than twice in a row | Varies per board |
| Credentials | Three stone niches: certifications as a ledger with seals, competitions as pinned notices (rotated up to 1.2°), the degree as a carved plaque | Ledger columns, notices staggered |
| Contact | A letter on parchment with ruled fields, wax seal as the submit control (opens mailto) | Letter left, addresses right |
| Footer | Town at dusk, lit windows, wall silhouette, faded oversized wordmark | Left |

```
HERO (desktop)                          WORK BOARD A            WORK BOARD B
+----------------------------------+    +-------+----------+    +------------------+
| bunting ~~~~~~~~~~~~~~~~~~~~~~~  |    | cover | title    |    | wide cover       |
| BUILDING IDEAS          [sign]   |    | frame | meta dl  |    +--------+---------+
| INTO INTELLIGENT        |feat. | |    |       | narr.    |    | title  | narr.   |
| EXPERIENCES.            +------+ |    +-------+----------+    | meta   | prob/sol|
| [plaster: lead + 3 CTAs]  (gate) |    | ledger of highlights |  +--------+---------+
| [stone ledger: 4 figures]        |    +----------------------+  | plaques of hl     |
+----------------------------------+                              +------------------+
```

## Gate timeline

| t (s) | Event |
|---|---|
| 0 | Gatehouse covers the screen; portcullis down; torches flicker; counter at 00 |
| load | Counter and portcullis step up with real milestones: fonts ready, hero sky, far, mid, near layers decoded |
| ready | Counter 100; prompt "Enter / Click / Scroll / Press Enter" appears; Skip intro is visible from the start |
| +0.0 | Portcullis finishes rising (0.7 s, chain-and-iron ease with a small overshoot) |
| +0.5 | Doors swing inward, `rotateY` 100° from the outer hinges, `power3.inOut`, 1.6 s; light seam widens; 0.35 s camera shake |
| +0.9 | Gatehouse scales to 2.6 with slight blur and bloom while the hero scene scales 1.15 to 1.0 (1.8 s) |
| +2.5 | Overlay fades, gets `hidden` and `aria-hidden`; focus moves to `main`; hero text staggers in |

Reduced motion: a 0.4 s fade. Shown once per session. GSAP is loaded only when the gate plays.

## Revisions after checking against design-system.md

- The first draft gave every section a scroll entrance. Cut to two scroll effects (statement lighting, banner-drop cover wipe). The wax seals press on hover and focus instead of on scroll.
- The first draft used blackletter for project titles. Moved to Grenze: "LinkVestor" and "CommonGround" capitals in Gotisch read poorly at 1.75rem.
- Dropped a planned numbered "Collect / Clean / Model / Ship" pipeline row (reads like a template); the data thread lives in the ledgers and the inked chart plates instead.
