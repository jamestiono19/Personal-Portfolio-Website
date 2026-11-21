/* ============================================================
   projects.js: the single source of truth for the Work section.

   Every card, filter count, counter and footer link is rendered
   from this array. Adding a project = adding one entry.

   Data rule: every figure below was read from the project's own
   files or its live page. The `source` on each highlight names
   the file it came from. Nothing is estimated or rounded up.
   ============================================================ */

/**
 * @typedef {"analytics"|"machine-learning"|"deep-learning"|"text-mining"|"app-development"} Category
 *
 * @typedef {Object} Highlight
 * @property {string} label    Short label, e.g. "Mean wait"
 * @property {string} value    The figure or statement, exactly as measured
 * @property {string} context  One line of context
 * @property {string} source   File, notebook, run or page the value came from
 *
 * @typedef {Object} Link
 * @property {string} label
 * @property {string} href
 * @property {"live"|"repo"|"prototype"} kind
 *
 * @typedef {Object} Image
 * @property {string} src
 * @property {string} alt
 * @property {number} width
 * @property {number} height
 * @property {string} [webp]   Optional WebP version used in a <picture>
 * @property {"photo"|"chart"|"screen"} [kind]
 *
 * @typedef {Object} Project
 * @property {string} slug
 * @property {string} title
 * @property {Category[]} category   First entry is the primary tag
 * @property {string} [subtag]       Secondary, non-filter tag
 * @property {string} year
 * @property {string} role
 * @property {string} duration
 * @property {string} status
 * @property {boolean} [featured]    Shown in the hero card
 * @property {Image} cover
 * @property {string} narration      2-4 sentences: problem, approach, outcome
 * @property {string} problem
 * @property {string} solution
 * @property {string} [solutionLabel] "Solution" (default), "Result" or "Insight"
 * @property {Link[]} links
 * @property {string[]} stack
 * @property {Highlight[]} highlights
 * @property {Image} [chart]         One real chart exported from the project
 */

/** Display names for the filter tabs, in tab order. */
export const CATEGORIES = {
  "analytics": "Analytics",
  "machine-learning": "Machine Learning",
  "deep-learning": "Deep Learning",
  "text-mining": "Text Mining",
  "app-development": "App Development",
};

/** @type {Project[]} */
export const PROJECTS = [
  {
    slug: "adaptive-traffic-lights",
    title: "Adaptive Traffic Lights",
    category: ["deep-learning", "machine-learning"],
    subtag: "Reinforcement learning",
    year: "2026",
    role: "Developer, 10 of 11 commits",
    duration: "Course final project",
    status: "Steps 1–11 of 14 complete",
    featured: true,
    cover: {
      src: "./Assets/projects/traffic-scenarios.webp",
      alt: "Bar chart comparing mean waiting time per traffic scenario for the fixed PKJI timer, the queue rule and the DQN controller on the held-out test seeds",
      width: 1600, height: 751, kind: "chart",
    },
    narration:
      "A fixed signal timer cannot react when demand on one road suddenly grows. I trained a Deep Q-Network in the SUMO simulator to decide, every five seconds of green, whether to keep the phase or switch. It was benchmarked against an Indonesian PKJI 2023 fixed plan and a tuned queue rule on 100 held-out test episodes, and cut the mean wait from 35.97 s to 20.31 s without losing throughput.",
    problem:
      "Fixed-time plans assume steady, balanced traffic. Under unbalanced or shifting demand they keep giving green to empty roads while queues build elsewhere.",
    solution:
      "A DQN agent reads 11 roadside values (phase, green time, queue and longest wait per arm) and chooses keep or switch. The reward charges every halted vehicle-second, and a signal manager enforces minimum green, yellow and all-red safety rules.",
    solutionLabel: "Approach",
    links: [
      { label: "Repository", href: "https://github.com/geoLeslie/adaptive-traffic-light-drl", kind: "repo" },
    ],
    stack: ["Python", "SUMO 1.28", "Gymnasium", "Stable-Baselines3", "PyTorch"],
    highlights: [
      { label: "Mean wait vs fixed timer", value: "20.31 s vs 35.97 s", context: "43.5% lower than the PKJI 2023 plan over 100 test episodes", source: "results/eval/test_dqn_full_s100.json, test_fixed_pkji.json" },
      { label: "Vs adaptive heuristic", value: "16.6% lower", context: "The tuned queue rule averaged 24.34 s on the same seeds", source: "README.md, results/eval/test_queue_rule.json" },
      { label: "Unseen stress demand", value: "50.56 s", context: "Against 62.92 s (PKJI) and 67.42 s (queue rule); stress was never seen in training", source: "results/eval/test_*.json" },
      { label: "Throughput", value: "672.76 vs 671.05", context: "Vehicles per episode: the gain did not come from serving fewer cars", source: "results/eval/test_dqn_full_s100.json" },
      { label: "Seed stability", value: "20.23–20.55 s", context: "Three training seeds (42, 100, 2026) on the test split", source: "results/eval/test_dqn_full_s*.json" },
      { label: "Ablation", value: "20.94 s", context: "Masking the four waiting-time inputs costs 0.63 s of mean wait", source: "results/eval/test_dqn_ablation_nowait_s100.json" },
      { label: "Where it still loses", value: "12.60 s vs 12.22 s", context: "On unbalanced demand the queue rule edges out the DQN; error analysis flags switches away from a platoon still queuing", source: "results/eval/final_test_summary_table.csv, error_analysis_report.json" },
    ],
    chart: {
      src: "./Assets/projects/traffic-learning.webp",
      alt: "DQN learning curves for three training seeds over 150,000 steps",
      width: 1600, height: 808, kind: "chart",
    },
  },
  {
    slug: "commonground",
    title: "CommonGround",
    category: ["app-development"],
    subtag: "Product and data",
    year: "2026",
    role: "One of four (Group 7), built Explore and venue discovery",
    duration: "Venture Creation project",
    status: "Live demo",
    cover: {
      src: "./Assets/projects/commonground-home.webp",
      alt: "CommonGround home screen on a phone: step 1 of 3, share the link to the group chat",
      width: 430, height: 932, kind: "screen",
    },
    narration:
      "Groups lose time deciding where to eat. CommonGround (\u201cSatu link. Semua jawab. Tiga pilihan pas.\u201d, one link, everyone answers, three right choices) sends one link to the group chat, collects each member's limits privately, and returns at most three places that break nobody's limits. No account is needed. Built as a four-person Venture Creation team, it also maps places to eat around three BINUS campuses from OpenStreetMap data.",
    problem:
      "In a group chat, the loudest preference wins or nobody decides. Budget, diet and travel limits are rarely said out loud.",
    solution:
      "A deterministic engine filters out any place that breaks a member's hard limit, scores the rest, drops anything under a fairness floor of 60 for any member, and ranks the top three. The group then votes in a hidden five-minute round.",
    solutionLabel: "How it works",
    links: [
      { label: "Live demo", href: "https://commond-ground.vercel.app/", kind: "live" },
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4", "Supabase", "Vercel"],
    highlights: [
      { label: "Options returned", value: "3", context: "Maximum results per room (MAX_RESULTS)", source: "packages/engine/src/recommend.ts" },
      { label: "Fairness floor", value: "60 / 100", context: "A place is dropped if any one member scores it below 60", source: "packages/engine/src/recommend.ts" },
      { label: "Score weights", value: "41, 29, 18, 12", context: "Cuisine, travel, price and rating; a missing rating shares its weight out", source: "packages/engine/src/score.ts" },
      { label: "Group size", value: "2–8 members", context: "Answers due in 3, 5 or 10 minutes, with one 5-minute extension", source: "packages/shared/src/index.ts" },
      { label: "Hard limits", value: "10 / 20 / 30 min", context: "Travel limit choices; budget Rp20,000–100,000 in Rp5,000 steps", source: "packages/shared/src/index.ts" },
      { label: "Venue data", value: "470 + 10", context: "OpenStreetMap draft places near campus plus chain branches", source: "data/places-draft-osm.csv, data/places-chains.csv" },
      { label: "Discovery area", value: "3 campuses", context: "BINUS Anggrek, Syahdan and Kijang, each searched within a 1,000 m radius", source: "data/campus-anchors.json" },
      { label: "Privacy", value: "30 min", context: "Answers are readable only by their owner and deleted 30 minutes after the room locks", source: "docs/PRD.md (F2.6)" },
    ],
    chart: {
      src: "./Assets/projects/commonground-jelajah.webp",
      alt: "CommonGround Explore page listing places to eat near campus within a chosen radius",
      width: 430, height: 932, kind: "screen",
    },
  },
  {
    slug: "text-mining",
    title: "Indonesian News Text Mining",
    category: ["text-mining", "deep-learning"],
    subtag: "NLP",
    year: "2026",
    role: "Sole author",
    duration: "Course final project (DTSC6008001)",
    status: "Pipeline complete",
    cover: {
      src: "./Assets/projects/textmining-f1.webp",
      alt: "Per-class F1 scores of the BiLSTM and IndoBERT classifiers on the test set",
      width: 1200, height: 525, kind: "chart",
    },
    narration:
      "I scraped 5,995 Indonesian Detik.com articles across five sections and built one pipeline that classifies them, discovers topics inside each class, and writes a topic-aware summary per topic. A BiLSTM trained from scratch reached 0.9413 macro-F1 and a fine-tuned IndoBERT reached 0.9546. The topic-aware summariser covered every topic, where a centroid baseline mostly covered one.",
    problem:
      "Raw news pages carry boilerplate, related-link cues and datelines that leak the label, and Indonesian morphology splits one word into many surface forms.",
    solution:
      "Boilerplate removal, an Indonesian-aware sentence splitter and Sastrawi stemming, then two classifiers, NMF topic models per class chosen by NPMI coherence and diversity, and MMR-based extractive summaries scored with ROUGE.",
    solutionLabel: "Approach",
    links: [],
    stack: ["Python", "PyTorch", "IndoBERT", "scikit-learn", "Sastrawi", "BeautifulSoup"],
    highlights: [
      { label: "Corpus", value: "5,995 articles", context: "Five Detik.com sections, about 1,200 each, published 20 Jun to 23 Sep 2026", source: "data/processed/corpus_build_report.csv" },
      { label: "Best classifier", value: "0.9546 macro-F1", context: "IndoBERT (indobert-base-p1), 900 test articles", source: "data/results/04_indobert_summary.json" },
      { label: "From scratch", value: "0.9413 macro-F1", context: "BiLSTM; a learning rate of 0.003 beat 0.001 in all four paired settings", source: "data/results/03_bilstm_summary.json, 03_bilstm_grid.csv" },
      { label: "Context length", value: "128 tokens", context: "Matched 256 tokens on IndoBERT validation F1 (0.9467 vs 0.9466), so the shorter input was kept", source: "data/results/04_indobert_grid.csv" },
      { label: "Vocabulary", value: "43,293 words", context: "Down from 57,499 after topic-view filtering; 25,634 words stemmed", source: "data/processed/preprocess.log" },
      { label: "Topics found", value: "37", context: "NMF per class; Esports was the most coherent (NPMI 0.87)", source: "data/results/06_topic_keywords.csv" },
      { label: "Hardest pair", value: "News and Finance", context: "16 of IndoBERT's 41 test errors were swaps between these two; Sports was easiest (F1 0.99)", source: "data/results/04_indobert_predictions.csv" },
      { label: "Summary coverage", value: "1.00 vs 0.10–0.375", context: "Topic coverage in all five classes: topic-aware summaries vs the centroid baseline", source: "data/results/07_summary_evaluation.csv" },
      { label: "ROUGE-1 F1 (News)", value: "0.289", context: "Against 0.170 random and 0.151 lead; in Sports the centroid baseline scored higher (0.268 vs 0.255)", source: "data/results/07_summary_evaluation.csv" },
    ],
    chart: {
      src: "./Assets/projects/textmining-topics.webp",
      alt: "Topic distribution across the five news classes",
      width: 1600, height: 320, kind: "chart",
    },
  },
  {
    slug: "datafest-2026",
    title: "ASA DataFest 2026",
    category: ["analytics"],
    subtag: "Healthcare data",
    year: "2026",
    role: "One of three, team Penjelajah Sejarah",
    duration: "Competition",
    status: "Submitted write-up, slides and video",
    cover: {
      src: "./Assets/Datafest.webp",
      alt: "Bar chart of high-impact drivers of patient dropout, led by chronic status",
      width: 1600, height: 1000, kind: "chart",
    },
    narration:
      "Why do chronic patients drop out of care? We linked millions of clinical encounters to social-determinant survey answers and followed the patients who never came back. Most of them were never screened for hardship, almost none were contacted, and the ones who were screened reported hardship far more often than returning patients.",
    problem:
      "Chronic patients who stop returning leave little trace. A dropout here is a patient with exactly one encounter in the whole dataset; of 6,292 chronic dropouts, 5,819 had no hardship survey answers at all.",
    solution:
      "Emergency or urgent visits rose from 31.4% to 53.4% of visits as paying for basics went from \u201cnot hard at all\u201d to \u201cvery hard\u201d.",
    solutionLabel: "Insight",
    links: [
      { label: "Repository", href: "https://github.com/jamestiono19/ASA-Datafest-Competition2026-PenjelajahSejarah", kind: "repo" },
    ],
    stack: ["Python", "pandas", "scikit-learn", "seaborn"],
    highlights: [
      { label: "Encounters", value: "7,675,801", context: "All encounters in the competition data; 1,876,260 were chronic", source: "test1.ipynb" },
      { label: "Never screened", value: "92.5%", context: "5,819 of 6,292 chronic dropouts had no hardship survey data", source: "test1.ipynb" },
      { label: "No outreach", value: "99.9%", context: "6,288 of 6,292 chronic dropouts had no outreach on record", source: "test1.ipynb" },
      { label: "Hardship gap", value: "47.1% vs 18.1%", context: "Any hardship among screened dropouts vs returning patients", source: "test1.ipynb" },
      { label: "Crisis visits", value: "31.4% to 53.4%", context: "Share of answered encounters that were emergency, urgent or ED visits, from \u201cnot hard at all\u201d to \u201cvery hard\u201d to pay for basics", source: "ASADATAFEST.ipynb" },
      { label: "Largest hardship gap", value: "36.6% vs 9.5%", context: "Food insecurity among screened dropouts vs returning patients", source: "test1.ipynb" },
      { label: "Outreach blind spot", value: "0.1% vs 6.4%", context: "Chronic dropouts were contacted less often than non-chronic ones (4 of 6,292 vs 2,966 of 46,088)", source: "test1.ipynb" },
    ],
    chart: {
      src: "./Assets/projects/datafest-outreach.webp",
      alt: "Outreach coverage among all dropout patients",
      width: 1485, height: 730, kind: "chart",
    },
  },
  {
    slug: "body-fat",
    title: "Body Fat Prediction",
    category: ["machine-learning"],
    subtag: "MLOps",
    year: "2026",
    role: "ML engineer",
    duration: "Course project",
    status: "Live on Streamlit",
    cover: {
      src: "./Assets/Bodyfat.png", webp: "./Assets/Bodyfat.webp",
      alt: "Body Fat Prediction dashboard showing body-fat percentage, BMI and waist-to-hip ratio",
      width: 1600, height: 1033, kind: "screen",
    },
    narration:
      "Body fat says more about health than weight, but measuring it directly is rarely practical. I compared four regression models on 252 subjects and 13 tape-measure inputs, tracked every run in MLflow, and shipped the chosen Lasso pipeline as a Streamlit app with health, nutrition and history views.",
    problem:
      "Direct body-fat measurement needs special equipment. The question was how much a few everyday measurements can recover.",
    solution:
      "Lasso had the best cross-validated R² (0.681). Abdomen circumference carried most of the signal (r = 0.81), while height barely mattered (r = 0.09).",
    solutionLabel: "Result",
    links: [
      { label: "Open app", href: "https://bodyfat-app.streamlit.app/", kind: "live" },
      { label: "Repository", href: "https://github.com/jamestiono19/Bodyfat-app", kind: "repo" },
    ],
    stack: ["Python", "scikit-learn", "MLflow", "Streamlit"],
    highlights: [
      { label: "Dataset", value: "252 × 13", context: "Subjects and body-measurement inputs", source: "data/bodyfat.csv, mlruns features.json" },
      { label: "Best CV R²", value: "0.681", context: "Lasso, 5-fold cross-validation (± 0.046)", source: "artifacts/model_comparison.csv" },
      { label: "Test error", value: "MAE 3.58", context: "Body-fat percentage points on the 30% hold-out", source: "artifacts/model_comparison.csv" },
      { label: "Strongest input", value: "r = 0.81", context: "Abdomen circumference, ahead of chest (0.70) and hip (0.63)", source: "artifacts/eda/strong_correlations.csv" },
      { label: "Hold-out R²", value: "0.590", context: "Lasso on the 30% test split. Random forest scored higher there (0.638); Lasso was picked on cross-validation", source: "artifacts/model_comparison.csv" },
      { label: "Overfitting check", value: "0.865 vs 0.641", context: "Random forest train vs validation R², so the simpler model won", source: "artifacts/model_comparison.csv" },
      { label: "Leakage guard", value: "Density dropped", context: "Body fat is computed from density (r = 0.99), so it was excluded as an input", source: "notebook/mlopsbodyfat.ipynb, strong_correlations.csv" },
      { label: "Model weight", value: "8.19 vs 1.87", context: "Absolute Lasso coefficients: abdomen against the next largest input, wrist (negative)", source: "models/coefficients.csv" },
    ],
    chart: {
      src: "./Assets/projects/bodyfat-abdomen.webp",
      alt: "Scatter plot of abdomen circumference against body-fat percentage",
      width: 1600, height: 990, kind: "chart",
    },
  },
  {
    slug: "matcha",
    title: "Matcha E-commerce Website",
    category: ["app-development"],
    subtag: "Frontend",
    year: "2025",
    role: "Frontend developer",
    duration: "1-month sprint",
    status: "Live on Netlify",
    cover: {
      src: "./Assets/Matcha.png", webp: "./Assets/Matcha.webp",
      alt: "Matcha Delight website shown on desktop and mobile",
      width: 1536, height: 1024, kind: "screen",
    },
    narration:
      "A storefront for a matcha café that takes visitors from browsing to a complete order on one page. The order form validates each field and merges the order into a client-side cart, so the whole flow works without a backend.",
    problem:
      "Matcha buyers need clear product information and a short path to ordering.",
    solution:
      "One validated order form covers every drink and dessert with per-order toppings, built in plain HTML, CSS and JavaScript.",
    links: [
      { label: "Visit site", href: "https://matchadelight.netlify.app/", kind: "live" },
    ],
    stack: ["HTML", "CSS", "JavaScript", "Swiper"],
    highlights: [
      { label: "Menu items", value: "13", context: "Drinks and desserts, all orderable from one form", source: "matchadelight.netlify.app (order form)" },
      { label: "Toppings", value: "14", context: "Chosen per order, from boba to granola", source: "matchadelight.netlify.app (order form)" },
      { label: "Order fields", value: "8", context: "Name, number, item, topping, amount, time, address, note", source: "matchadelight.netlify.app (order form)" },
    ],
  },
  {
    slug: "ecorangers",
    title: "EcoRangers",
    category: ["app-development"],
    subtag: "Educational game",
    year: "2024",
    role: "Developer and UI designer",
    duration: "2-month sprint",
    status: "Prototype on itch.io",
    cover: {
      src: "./Assets/Ecorangers.png", webp: "./Assets/Ecorangers.webp",
      alt: "EcoRangers title screen above a park scattered with litter",
      width: 1600, height: 898, kind: "screen",
    },
    narration:
      "A 2D arcade game that teaches young players to sort waste. Progressive levels and instant feedback turn the rule into a habit rather than a lesson to memorise.",
    problem:
      "Children are rarely introduced to waste sorting early, so the habit never forms.",
    solution:
      "Short sorting challenges that get harder level by level, with feedback on every choice.",
    links: [
      { label: "Play on itch.io", href: "https://akj16.itch.io/ecorangers", kind: "live" },
    ],
    stack: ["Unity", "C#", "Figma"],
    highlights: [
      { label: "Platforms", value: "2", context: "Browser (HTML5) and Windows", source: "itch.io listing" },
      { label: "Windows build", value: "39 MB", context: "Packaged download", source: "itch.io listing" },
      { label: "Access", value: "Free", context: "Plays in the browser", source: "itch.io listing" },
    ],
  },
  {
    slug: "linkvestor",
    title: "LinkVestor",
    category: ["app-development"],
    subtag: "Fintech prototype",
    year: "2024",
    role: "Product designer",
    duration: "3-month sprint",
    status: "Figma prototype",
    cover: {
      src: "./Assets/Linkvestor.png", webp: "./Assets/Linkvestor.webp",
      alt: "LinkVestor presentation board with the portfolio dashboard on a phone",
      width: 1600, height: 900, kind: "screen",
    },
    narration:
      "A mobile investment app that connects Indonesian small businesses (UMKM) with investors. I designed the prototype around verified business profiles and a live portfolio dashboard, so an investor can judge an opportunity before committing money.",
    problem:
      "Promising UMKM lack capital, while investors struggle to find opportunities they can trust.",
    solution:
      "Verified UMKM listings, a live dashboard and alerts, organised into four tabs.",
    links: [
      { label: "View prototype", href: "https://www.figma.com/proto/iarMFBCaKiP1DYb6ab7NQ2/LinkVestor?node-id=13-310&t=Jz6dqvdizMlXJt9G-1", kind: "prototype" },
    ],
    stack: ["Figma", "SwiftUI", "Firebase", "MongoDB", "REST API"],
    highlights: [
      { label: "Core features", value: "4", context: "Secure and trusted, real-time dashboard, verified UMKM, smart notifications", source: "Project board (Assets/Linkvestor.png)" },
      { label: "App tabs", value: "4", context: "Home, Discover, Activity and Wallet", source: "Project board (Assets/Linkvestor.png)" },
      { label: "Quick actions", value: "4", context: "Invest, Portfolio, Watchlist and Profile from the home screen", source: "Project board (Assets/Linkvestor.png)" },
      { label: "User groups", value: "2", context: "UMKM owners and investors", source: "Project board (Assets/Linkvestor.png)" },
    ],
  },
];

/** Count projects per category; `all` is the total. */
export function countByCategory(list = PROJECTS) {
  const counts = { all: list.length };
  Object.keys(CATEGORIES).forEach((key) => {
    counts[key] = list.filter((p) => p.category.includes(key)).length;
  });
  return counts;
}

/** Number of disciplines with at least one project. */
export function domainCount(list = PROJECTS) {
  const counts = countByCategory(list);
  return Object.keys(CATEGORIES).filter((key) => counts[key] > 0).length;
}
