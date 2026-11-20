// @ts-check
/* ════════════════════════════════════════════════════════════════
   projects.js — the single source of truth for the Work section.

   Everything project-related on the page is rendered from this list:
   the case cards, the filter tabs and their counts, the hero stat
   strip ("Projects", "Domains"), the featured card in the hero, the
   Work intro sentence and the footer's project links.

   Adding a project = adding one entry below.

   DATA RULE: every number in `highlights` and `chart` is copied from
   a file in the project's own repository (or the CV in this repo), and
   `source` names that file. Nothing is estimated. Projects whose files
   have not been read yet are marked `pending: true` and show no metrics.
   ════════════════════════════════════════════════════════════════ */

/**
 * @typedef {"analytics" | "machine-learning" | "deep-learning" | "text-mining" | "app-development"} Category
 *
 * @typedef {Object} Highlight
 * @property {string} label    short label, e.g. "Best CV R²"
 * @property {string} value    the figure or statement, e.g. "0.68"
 * @property {string} [unit]   optional unit rendered smaller, e.g. "M", "%"
 * @property {string} context  one line of plain-language context
 * @property {string} source   where it came from (file / notebook / run)
 *
 * @typedef {Object} Chart
 * @property {string} title
 * @property {string} source
 * @property {string} [unit]   suffix for the value labels
 * @property {number} [max]    axis maximum (defaults to the largest value)
 * @property {number} [digits] decimals shown on the value labels
 * @property {{ label: string, value: number }[]} data
 *
 * @typedef {Object} Link
 * @property {"live" | "repo" | "prototype" | "play"} kind
 * @property {string} label
 * @property {string} href
 *
 * @typedef {Object} Cover
 * @property {string} base     path without size/extension, e.g. "./Assets/covers/bodyfat"
 * @property {number[]} widths available widths (each as .avif and .webp)
 * @property {number} width    intrinsic width of the largest file
 * @property {number} height   intrinsic height of the largest file
 * @property {string} alt
 *
 * @typedef {Object} Project
 * @property {string} slug
 * @property {string} title
 * @property {Category[]} category   first entry is the primary tag
 * @property {number | null} year
 * @property {string} role
 * @property {string} duration       duration or status
 * @property {Cover} cover
 * @property {string} narration      2–4 sentences: problem, approach, outcome
 * @property {{ label: string, text: string }} problem
 * @property {{ label: string, text: string }} solution   "Solution", "Result" or "Insight"
 * @property {Link[]} links
 * @property {string[]} stack
 * @property {Highlight[]} highlights
 * @property {Chart} [chart]
 * @property {string} [ornament]     corner ornament for its border
 * @property {boolean} [featured]    shown in the hero's featured card
 * @property {boolean} [pending]     write-up not verified yet: no metrics shown
 */

/** @type {Record<Category, string>} */
export const CATEGORY_LABELS = {
  "analytics": "Analytics",
  "machine-learning": "Machine Learning",
  "deep-learning": "Deep Learning",
  "text-mining": "Text Mining",
  "app-development": "App Development",
};

/** Order of the filter tabs. */
/** @type {Category[]} */
export const CATEGORY_ORDER = ["analytics", "machine-learning", "deep-learning", "text-mining", "app-development"];

/** @type {Project[]} */
export const projects = [
  /* ── 01 · EcoRangers ─────────────────────────────────────────── */
  {
    slug: "ecorangers",
    title: "EcoRangers",
    category: ["app-development"],
    year: 2024,
    role: "Developer & UI Designer",
    duration: "2-month sprint · Prototype",
    cover: {
      base: "./Assets/covers/ecorangers", widths: [200, 800, 1600], width: 1600, height: 898,
      alt: "EcoRangers title screen: the game logo and a Play button above a park scattered with litter",
    },
    narration:
      "An educational Unity game that turns waste sorting into a repeatable daily habit for young learners. " +
      "Players clear a littered park through progressive challenges, and every sort gets instant feedback, " +
      "so the lesson is learned by playing rather than by reading.",
    problem: { label: "Problem", text: "Lack of early introduction to waste-sorting habits, leading to poor environmental awareness." },
    solution: { label: "Solution", text: "Gamified learning through fun gameplay, progressive challenges and educational feedback loops." },
    links: [{ kind: "play", label: "Play on itch.io", href: "https://akj16.itch.io/ecorangers" }],
    stack: ["Unity", "C#", "Figma"],
    highlights: [
      { label: "Platforms", value: "2", context: "Browser (HTML5) and Windows", source: "itch.io listing" },
      { label: "Windows build", value: "39", unit: "MB", context: "Packaged download on itch.io", source: "itch.io listing" },
      { label: "Access", value: "Free", context: "Plays in the browser, with a mobile-support update", source: "itch.io listing" },
      { label: "Genre", value: "2D puzzle", context: "Educational puzzle with arcade pacing", source: "itch.io listing" },
    ],
    ornament: "fern",
  },

  /* ── 02 · Matcha ─────────────────────────────────────────────── */
  {
    slug: "matcha",
    title: "Matcha E-commerce Website",
    category: ["app-development"],
    year: 2025,
    role: "Frontend Developer",
    duration: "1-month sprint · Live on Netlify",
    cover: {
      base: "./Assets/covers/matcha", widths: [200, 800, 1600], width: 1600, height: 1067,
      alt: "Matcha e-commerce website presentation board with desktop and mobile layouts",
    },
    narration:
      "An online storefront for a matcha café, built around a clearer path from discovery to checkout. " +
      "The whole menu, toppings included, is orderable from one validated form that feeds a client-side cart, " +
      "so enthusiasts can compare products confidently and order with less friction.",
    problem: { label: "Problem", text: "Matcha enthusiasts struggle to find quality products with clear information and a smooth shopping experience." },
    solution: { label: "Result", text: "A delightful shopping flow that builds trust and engagement for matcha lovers, live on Netlify." },
    links: [{ kind: "live", label: "Visit site", href: "https://matchadelight.netlify.app/" }],
    stack: ["HTML", "CSS", "JavaScript", "Swiper", "Font Awesome", "Netlify"],
    highlights: [
      { label: "Menu items", value: "13", context: "Drinks and desserts, all orderable from one form", source: "live site" },
      { label: "Toppings", value: "14", context: "Chosen per order, from boba to granola", source: "live site" },
      { label: "Order fields", value: "8", context: "Validated, then merged into a client-side cart", source: "live site" },
    ],
    ornament: "bud",
  },

  /* ── 03 · Body Fat Prediction ────────────────────────────────── */
  {
    slug: "body-fat-prediction",
    title: "Body Fat Prediction",
    category: ["machine-learning"],
    year: 2026,
    role: "ML Engineer",
    duration: "Live on Streamlit",
    cover: {
      base: "./Assets/covers/bodyfat", widths: [200, 800, 1600], width: 1600, height: 1033,
      alt: "Body Fat Prediction System dashboard with body-fat percentage, BMI and waist-to-hip ratio results",
    },
    narration:
      "Body fat says more about health than weight alone, yet measuring it directly is rarely practical. " +
      "I trained four regression models on 252 people's tape-measure and scale readings, tracked every run in MLflow, " +
      "and shipped the winning pipeline as a Streamlit app that turns an estimate into health, nutrition and history views.",
    problem: { label: "Problem", text: "Accurate body-fat measurement needs lab equipment; everyday measurements are easy but noisy." },
    solution: { label: "Result", text: "Lasso won 5-fold cross-validation (R² 0.68). Abdomen circumference alone carries most of the signal (r = 0.81)." },
    links: [
      { kind: "live", label: "Open app", href: "https://bodyfat-app.streamlit.app/" },
      { kind: "repo", label: "Repository", href: "https://github.com/jamestiono19/Bodyfat-app" },
    ],
    stack: ["Python", "Pandas", "Scikit-learn", "MLflow", "Streamlit"],
    highlights: [
      { label: "Subjects", value: "252", context: "13 inputs each: age, weight, height and 10 circumferences", source: "data/bodyfat.csv" },
      { label: "Best CV R²", value: "0.68", context: "Lasso (α = 0.1), 5-fold grid search, ±0.046 across folds", source: "artifacts/model_comparison.csv" },
      { label: "Test MAE", value: "3.58", context: "Body-fat points on the 76-person hold-out set (Lasso)", source: "artifacts/model_comparison.csv" },
      { label: "Strongest signal", value: "r 0.81", context: "Abdomen circumference; height barely relates (r = 0.09)", source: "artifacts/eda/strong_correlations.csv" },
      { label: "Overfit check", value: "0.87 → 0.64", context: "Random forest's train-fold R² vs its CV R²: most flexible, least general", source: "artifacts/model_comparison.csv" },
      { label: "Outliers removed", value: "14", context: "IQR × 1.5 filter on the 176 training rows; test rows untouched", source: "notebook/mlopsbodyfat.ipynb" },
    ],
    chart: {
      title: "Absolute correlation with body-fat %",
      source: "artifacts/eda/strong_correlations.csv",
      max: 1,
      digits: 2,
      data: [
        { label: "Abdomen", value: 0.81 },
        { label: "Chest", value: 0.70 },
        { label: "Hip", value: 0.63 },
        { label: "Weight", value: 0.61 },
        { label: "Thigh", value: 0.56 },
        { label: "Height", value: 0.09 },
      ],
    },
    ornament: "monstera",
  },

  /* ── 04 · LinkVestor ─────────────────────────────────────────── */
  {
    slug: "linkvestor",
    title: "LinkVestor",
    category: ["app-development", "analytics"],
    year: 2024,
    role: "Product Designer",
    duration: "3-month sprint · Figma prototype",
    cover: {
      base: "./Assets/covers/linkvestor", widths: [200, 800, 1600], width: 1600, height: 900,
      alt: "LinkVestor presentation board with the app's portfolio dashboard on a phone",
    },
    narration:
      "A mobile platform that makes MSME (UMKM) investment opportunities easier to evaluate. " +
      "It pairs transparent business context with a live portfolio dashboard and alerts, " +
      "so investors can decide with confidence and promising small businesses can reach capital.",
    problem: { label: "Problem", text: "Promising UMKM lack access to capital, while investors struggle to find trustworthy, transparent opportunities." },
    solution: { label: "Solution", text: "Verified UMKM listings, a live dashboard and alerts, prototyped end to end in Figma." },
    links: [{ kind: "prototype", label: "View prototype", href: "https://www.figma.com/proto/iarMFBCaKiP1DYb6ab7NQ2/LinkVestor?node-id=13-310&t=Jz6dqvdizMlXJt9G-1" }],
    stack: ["Figma", "SwiftUI", "Firebase", "MongoDB", "REST API"],
    highlights: [
      { label: "Core features", value: "4", context: "Security, live dashboard, verified UMKM, alerts", source: "project brief" },
      { label: "App tabs", value: "4", context: "Home, Discover, Activity and Wallet", source: "project brief" },
      { label: "User groups", value: "2", context: "UMKM owners and investors", source: "project brief" },
    ],
    ornament: "branch",
  },

  /* ── 05 · ASA DataFest 2026 ──────────────────────────────────── */
  {
    slug: "asa-datafest-2026",
    title: "ASA DataFest 2026",
    category: ["analytics", "machine-learning"],
    year: 2026,
    role: "Team Penjelajah Sejarah",
    duration: "Competition · Healthcare data",
    cover: {
      base: "./Assets/covers/datafest", widths: [200, 800, 1600], width: 1600, height: 1000,
      alt: "Bar chart: high-impact drivers of patient dropout, led by chronic status at 32.4% feature importance",
    },
    narration:
      "Why do chronic patients drop out of care? We linked 7.68M clinical encounters to social-determinant surveys " +
      "and a chronic-condition reference, then modelled dropout with a random forest. " +
      "The data shows hardship pushing patients toward emergency care, and a survey gap that hides the people most at risk.",
    problem: { label: "Problem", text: "Chronic patients who never return leave little trace: 92.5% of them had no hardship survey on record." },
    solution: { label: "Insight", text: "Emergency or urgent visits rise from 31% to 53% as paying for basics goes from “not hard at all” to “very hard”." },
    links: [{ kind: "repo", label: "View repository", href: "https://github.com/jamestiono19/ASA-Datafest-Competition2026-PenjelajahSejarah" }],
    stack: ["Python", "Pandas", "Scikit-learn", "Seaborn"],
    highlights: [
      { label: "Encounters", value: "7.68", unit: "M", context: "7,675,801 rows; 5,873,703 remain after keeping clinical visits only", source: "FeatureImportanceModeling.ipynb" },
      { label: "Invisible dropouts", value: "92.5", unit: "%", context: "5,819 of 6,292 chronic dropouts had no hardship survey at all", source: "FeatureImportanceModeling.ipynb" },
      { label: "No outreach", value: "99.9", unit: "%", context: "6,288 of 6,292 chronic dropouts never got an outreach attempt", source: "FeatureImportanceModeling.ipynb" },
      { label: "Hardship gap", value: "47% vs 18%", context: "Surveyed dropouts reporting any hardship, vs returning patients", source: "FeatureImportanceModeling.ipynb" },
      { label: "Biggest gap", value: "Food", context: "Food insecurity: 36.6% of dropouts vs 9.5% of returning patients", source: "FeatureImportanceModeling.ipynb" },
      { label: "Dropout recall", value: "0.61", context: "Random forest on the dropout class, 84% overall accuracy", source: "FeatureImportanceModeling.ipynb" },
      { label: "Blind spot", value: "33.5", unit: "%", context: "Douglas County's dropout rate, the dataset's highest; 0 of its 567 dropouts were surveyed", source: "test1.ipynb" },
      { label: "ICD match", value: "95.6", unit: "%", context: "1.46M of 1.53M diagnoses joined to the AHRQ chronic-condition reference", source: "FeatureImportanceModeling.ipynb" },
    ],
    chart: {
      title: "Share of visits that were emergency or urgent, by how hard it is to pay for basics",
      source: "SocioEconomic-Emergency.ipynb",
      unit: "%",
      max: 60,
      digits: 1,
      data: [
        { label: "Not hard at all", value: 31.4 },
        { label: "Not very hard", value: 33.7 },
        { label: "Somewhat hard", value: 35.1 },
        { label: "Hard", value: 44.7 },
        { label: "Very hard", value: 53.4 },
      ],
    },
    ornament: "roots",
    featured: true,
  },

  /* ── 06 · Text Mining (pending) ──────────────────────────────── */
  {
    slug: "text-mining",
    title: "Text Mining Final Project",
    category: ["text-mining"],
    year: null,
    role: "Final project",
    duration: "Write-up in progress",
    cover: {
      base: "./Assets/scenery/canopy", widths: [480, 960], width: 960, height: 1173,
      alt: "Painted view looking up through a leafy canopy into the morning sky",
    },
    narration:
      "A text-mining final project. The full case study, covering the dataset, preprocessing pipeline, " +
      "methods and findings, is being written up from the project's notebooks and will be published here once every figure is verified.",
    problem: { label: "Problem", text: "To be published from the project files." },
    solution: { label: "Result", text: "To be published from the project files." },
    links: [],
    stack: [],
    highlights: [],
    ornament: "fern",
    pending: true,
  },

  /* ── 07 · Adaptive Traffic Lights (pending) ──────────────────── */
  {
    slug: "adaptive-traffic-lights",
    title: "Adaptive Traffic Lights",
    category: ["deep-learning"],
    year: null,
    role: "Final project",
    duration: "Write-up in progress",
    cover: {
      base: "./Assets/scenery/river", widths: [640, 1280], width: 1280, height: 747,
      alt: "Painted aerial view of a river winding through a forest at sunrise",
    },
    narration:
      "A deep learning final project on adaptive traffic-signal control for urban congestion. " +
      "The approach, training setup and results against fixed-time lights will be published here once they are verified from the project's code and logs.",
    problem: { label: "Problem", text: "Urban congestion at signalised intersections." },
    solution: { label: "Result", text: "To be published from the project files." },
    links: [],
    stack: [],
    highlights: [],
    ornament: "branch",
    pending: true,
  },
];
