# Needs confirmation

Things on the site that I could not check against a file, a commit or a live page. Each one is either shown with the weakest wording the evidence allows, or left off the site. Answer any of these and the copy can be tightened.

Checked on 21 November 2026 against these local folders:

- `James T/Sem 5/Deep Learning/Final Project/adaptive-traffic-light-drl`
- `James T/Sem 5/Text Mining/FinalProject`
- `James T/Sem 5/Venture Creation/website - CommonGround` (and `commond-ground-git`)
- `James T/Sem 4/ML/body-fat-prediction`
- `James T/ASA Datafest Competition`

No local folder was found for Matcha, EcoRangers or LinkVestor (searched `C:\Users\HP` five levels deep, case-insensitive).

## Roles

| Project | Shown on site | What the evidence says | Question |
|---|---|---|---|
| Adaptive Traffic Lights | Developer · 10 of 11 commits | `git log`: 10 commits by jamestiono19, 1 by Geoffrey Leslie (the first: simulator, scenarios, baselines). The repository belongs to `geoLeslie`. | Was this a two-person project, and is there a title you'd rather use than "Developer"? |
| CommonGround | Group 7 of four · built Explore and venue discovery | The Group 7 cover slide lists James Tiono, Gilbert Owen, Alexandro Julio Caesar and Geoffrey Leslie. In `website - CommonGround`, 11 of 12 commits are Gilbert Owen's. Your one commit (`fc3b70f`, 22 Oct 2026) adds the Explore page, the place map, place pages, the place forum, moderation, `data/campus-anchors.json` and the OpenStreetMap discovery data. | Did you also work on the pitch, research, Instagram posts or pilot? Anything outside the code is not visible to me. |
| Text Mining | Sole author | `PROJECT_PROGRESS_SUMMARY.md` names one student (James Tiono, 2802544406). No team is mentioned. | Confirm it was individual. |
| ASA DataFest 2026 | One of three · team Penjelajah Sejarah | The write-up (`PenjelajahSejarah_writeup.pdf`) is signed "Geoffrey, James, and Vinan". No git history or document splits the work by person. | What was your part (analysis, notebook, slides, video)? |
| Body Fat Prediction | ML engineer | One local folder, not a git repository, so no history to read. | Individual or group? |
| Matcha | Frontend developer | Carried over from the previous site. No local source. | Confirm. |
| EcoRangers | Developer and UI designer | Carried over. The itch.io page is published by `akj16`. | Confirm role and team size. |
| LinkVestor | Product designer | Carried over. Only the presentation board image exists locally. | Confirm. |

## Durations

| Project | Shown | Evidence |
|---|---|---|
| Matcha | 1-month sprint | Previous site only |
| EcoRangers | 2-month sprint | Previous site only |
| LinkVestor | 3-month sprint | Previous site only |
| Traffic Lights | Course final project | Commits run 11 to 19 Nov 2026; start date of the work is unknown |
| Text Mining | Course final project · DTSC6008001 | Articles span 20 Jun to 23 Sep 2026; working dates unknown |

## Figures checked and changed in this pass

- Text Mining, summary coverage: the centroid baseline's best class was 0.375. The site said 0.38; it now says 0.10–0.375 (`data/results/07_summary_evaluation.csv`).
- Text Mining, corpus dates: 20 Jun to 23 Sep 2026 are the articles' publication dates (`corpus_build_report.csv`, `period_start`/`period_end`), not when they were collected. The wording now says "published".
- ASA DataFest, "dropout": defined in `test1.ipynb` (cell "Tag dropout patients") as a patient with exactly one encounter in the full encounter table. That definition is now stated on the card, because every dropout percentage depends on it.
- ASA DataFest, 31.4% → 53.4%: share of encounters that were emergency, urgent or ED visits, among encounters where the patient answered "How hard is it for you to pay for the very basics…?" (`ASADATAFEST.ipynb`, cells 9 to 13). This covers all patients who answered, not only dropouts. The context line now says so.
- Body Fat: added the hold-out R² (0.590 for Lasso; random forest reached 0.638 on the same split) so the card doesn't imply Lasso won everywhere. Lasso was chosen on 5-fold CV R² (0.681).

## Claims from the brief that are not on the site

- **ASA DataFest "recall of 0.61" and "accuracy of 84%"**: no model output with these numbers appears in the outputs of `test1.ipynb` or `ASADATAFEST.ipynb`, and the three-page write-up (`PenjelajahSejarah_writeup.pdf`) reports no classifier scores. If they came from another notebook or the slides, point me to it and they can go back with a source.
- **"7.68 million encounters"**: the notebook prints 7,675,801. The exact figure is used.
- **Body Fat "best CV R² 0.68" and "MAE 3.6"**: the files say 0.681 and 3.58. The exact figures are used.

## Assets that would make the site stronger

1. **Adaptive Traffic Lights, a SUMO screenshot.** The cards show two charts but no picture of the junction. Wanted: a 16:9 SUMO GUI capture of the four-arm intersection mid-episode with queues visible, default SUMO colours, around 1600 × 900. `results/replays/` has the trajectories to stage one.
2. **ASA DataFest, a cover that is not a chart.** The cover is the dropout-drivers chart. A clean 16:10 capture of the title slide from `PenjelajahSejarah_slides.pdf` would read better as a cover.
3. **Portrait.** `Assets/Hero.jpeg` is 719 × 900. A 1200 × 1500 (4:5) version of the same portrait in soft daylight would stay sharp on large screens.
4. **Matcha, EcoRangers, LinkVestor.** Their highlights are counts read from live pages (menu items, platforms, app tabs). They have no outcome figures because none were found. Any real numbers (players, orders, test results) would replace them.

## Links

- `https://bodyfat-app.streamlit.app/` answers with a redirect (HTTP 303), which is what Streamlit does when an app is asleep. It wakes on a visit.
- `https://akj16.itch.io/ecorangers` returned HTTP 429 (rate limited) during the check, not a 404.
- All other project links returned 200 on 21 November 2026.
