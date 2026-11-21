/* ============================================================
   render.js: builds every data-driven part of the page.

   From projects.js: the featured sign in the hero, the filter
   banners, the project boards, all counters, the footer list.
   From credentials.js: the three credential groups.
   ============================================================ */

import { PROJECTS, CATEGORIES, countByCategory, domainCount } from "./projects.js";
import { CREDENTIALS, GROUPS } from "./credentials.js";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const SHOWN = 4; // findings visible before "Show all"

/** Escape text before it goes into innerHTML. */
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ── Heraldry: one ordinary per category ───────────────────────
   Plain geometric charges on a shield, so the category can be read
   from the frame alone. Colours come from --cat-* tokens. */
const ORDINARY = {
  "analytics": '<rect x="0" y="9" width="24" height="8"/>',                       // fess
  "machine-learning": '<path d="M0 22 12 9l12 13v-6L12 3 0 16z"/>',              // chevron
  "deep-learning": '<rect x="8" y="0" width="8" height="28"/>',                    // pale
  "text-mining": '<path d="M-2 3 3-2l23 23-5 5z"/>',                               // bend
  "app-development": '<path d="M-2 2 2-2l10 10L22-2l4 4-10 10 10 10-4 4-10-10L2 30l-4-4 10-10z"/>', // saltire
};

let shieldN = 0;
export function shield(cat, cls = "shield") {
  const id = `sh${++shieldN}`;
  return `<svg class="${cls}" viewBox="0 0 24 28" aria-hidden="true" style="--cat:var(--cat-${cat})">
    <clipPath id="${id}"><path d="M0 0h24v14c0 7-6 11.5-12 14C6 25.5 0 21 0 14z"/></clipPath>
    <path class="shield__field" d="M0 0h24v14c0 7-6 11.5-12 14C6 25.5 0 21 0 14z"/>
    <g class="shield__charge" clip-path="url(#${id})">${ORDINARY[cat]}</g>
  </svg>`;
}

/** <picture> with an optional WebP source. */
function picture(img, { lazy = true } = {}) {
  const attrs = `src="${esc(img.src)}" alt="${esc(img.alt)}" width="${img.width}" height="${img.height}" decoding="async"${lazy ? ' loading="lazy"' : ""}`;
  if (!img.webp) return `<img ${attrs}>`;
  return `<picture><source srcset="${esc(img.webp)}" type="image/webp"><img ${attrs}></picture>`;
}

function links(list) {
  if (!list.length) return '<p class="board__links board__links--none">No public link yet.</p>';
  return `<p class="board__links">${list
    .map((l) => `<a class="btn btn--small btn--${l.kind === "repo" ? "line" : "timber"}" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}<span class="sr-only"> (opens in a new tab)</span></a>`)
    .join("")}</p>`;
}

/* ── Findings: fixed fields and order, three presentations ───── */
function finding(h, i, style) {
  const hidden = i >= SHOWN ? " hidden data-extra" : "";
  return `<li class="finding finding--${style}"${hidden}>
    <span class="finding__fig">${esc(h.value)}</span>
    <span class="finding__label">${esc(h.label)}</span>
    <span class="finding__ctx">${esc(h.context)}</span>
    <span class="finding__src"><span class="sr-only">Source: </span>${esc(h.source)}</span>
  </li>`;
}

function findings(p, style) {
  const n = p.highlights.length;
  const more = n > SHOWN
    ? `<button type="button" class="findings__more" aria-expanded="false" aria-controls="f-${p.slug}" data-more="${n}">Show all ${n} findings</button>`
    : "";
  const chart = p.chart
    ? `<figure class="plate${p.chart.height > p.chart.width ? " plate--tall" : ""}">
        <div class="plate__img">${picture(p.chart)}</div>
        <figcaption>${esc(p.chart.alt)}</figcaption>
      </figure>`
    : "";
  return `<section class="board__findings" aria-labelledby="fh-${p.slug}">
    <h4 class="board__sub" id="fh-${p.slug}">Findings</h4>
    <ol class="findings findings--${style}" id="f-${p.slug}">${p.highlights.map((h, i) => finding(h, i, style)).join("")}</ol>
    ${more}
    <p class="board__stack"><span class="label">Built with</span> ${p.stack.map(esc).join(", ")}</p>
    ${chart}
  </section>`;
}

/* ── One project board. Layouts rotate a, b, c so no layout runs
   more than twice in a row; the internal order never changes:
   cover, brief and narration, findings. */
const LAYOUTS = ["a", "b", "c"];
const FINDING_STYLES = { a: "ledger", b: "plaques", c: "columns" };

function board(p, i) {
  const layout = LAYOUTS[i % LAYOUTS.length];
  const primary = p.category[0];
  const tags = p.category.map((c) => `<li style="--cat:var(--cat-${c})">${shield(c, "shield shield--tag")}${esc(CATEGORIES[c])}</li>`).join("");
  const coverKind = p.cover.kind === "chart" ? "chart" : p.cover.height > p.cover.width ? "phone" : "screen";
  return `<article class="board board--${layout}" id="project-${p.slug}" data-cats="${p.category.join(" ")}" style="--cat:var(--cat-${primary})" aria-labelledby="t-${p.slug}">
    <figure class="board__cover board__cover--${coverKind}" data-reveal>
      <span class="board__bracket" aria-hidden="true"></span>
      <span class="board__banner" aria-hidden="true">${shield(primary, "shield shield--banner")}</span>
      <div class="board__frame">${picture(p.cover)}</div>
    </figure>
    <div class="board__brief">
      <ul class="board__tags" aria-label="Disciplines">${tags}${p.subtag ? `<li class="board__subtag">${esc(p.subtag)}</li>` : ""}</ul>
      <h3 class="board__title" id="t-${p.slug}">${esc(p.title)}</h3>
      <dl class="board__meta">
        <div><dt>Year</dt><dd>${esc(p.year)}</dd></div>
        <div><dt>Role</dt><dd>${esc(p.role)}</dd></div>
        <div><dt>Format</dt><dd>${esc(p.duration)}</dd></div>
        <div><dt>Status</dt><dd>${esc(p.status)}</dd></div>
      </dl>
      <p class="board__narration">${narration(p)}</p>
      <div class="board__ps">
        <div><h4 class="board__sub">Problem</h4><p>${esc(p.problem)}</p></div>
        <div><h4 class="board__sub">${esc(p.solutionLabel || "Solution")}</h4><p>${esc(p.solution)}</p></div>
      </div>
      ${links(p.links)}
    </div>
    ${findings(p, FINDING_STYLES[layout])}
  </article>`;
}

/** The CommonGround tagline is Indonesian: mark it so it is read,
    hyphenated and quoted correctly. */
function narration(p) {
  const text = esc(p.narration);
  if (p.slug !== "commonground") return text;
  return text.replace("“Satu link. Semua jawab. Tiga pilihan pas.”", '<q lang="id">Satu link. Semua jawab. Tiga pilihan pas.</q>');
}

function renderBoards() {
  const host = document.getElementById("projects");
  if (!host) return;
  host.innerHTML = PROJECTS.map(board).join("");
  host.addEventListener("click", (e) => {
    const btn = e.target.closest(".findings__more");
    if (!btn) return;
    const list = document.getElementById(btn.getAttribute("aria-controls"));
    const open = btn.getAttribute("aria-expanded") !== "true";
    list.querySelectorAll("[data-extra]").forEach((li) => (li.hidden = !open));
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Show fewer findings" : `Show all ${btn.dataset.more} findings`;
    if (open) list.querySelectorAll("[data-extra]")[0]?.setAttribute("tabindex", "-1");
  });
}

/* ── Filters: cloth banners with live counts ─────────────────── */
function renderFilters() {
  const host = document.getElementById("filters");
  if (!host) return;
  const counts = countByCategory();
  const tab = (key, label, n) =>
    `<button type="button" class="filter" data-filter="${key}" aria-pressed="${key === "all"}"${key !== "all" ? ` style="--cat:var(--cat-${key})"` : ""}>
      ${key !== "all" ? shield(key, "shield shield--filter") : ""}<span>${esc(label)}</span><span class="filter__n">${n}</span>
    </button>`;
  host.innerHTML = tab("all", "All", counts.all) +
    Object.entries(CATEGORIES).map(([k, v]) => tab(k, v, counts[k])).join("");
}

export function bindFilters(onChange) {
  const host = document.getElementById("filters");
  const status = document.getElementById("filter-status");
  if (!host) return;
  host.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    const key = btn.dataset.filter;
    host.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    let n = 0;
    document.querySelectorAll(".board").forEach((el) => {
      const show = key === "all" || el.dataset.cats.split(" ").includes(key);
      el.hidden = !show;
      if (show) n += 1;
    });
    if (status) status.textContent = key === "all"
      ? `Showing all ${n} projects.`
      : `Showing ${n} of ${PROJECTS.length} projects in ${CATEGORIES[key]}.`;
    onChange && onChange();
  });
}

/* ── Hero: the featured project hangs as a shop sign ─────────── */
function renderFeatured() {
  const host = document.getElementById("featured");
  const p = PROJECTS.find((x) => x.featured) || PROJECTS[0];
  if (!host || !p) return;
  const h = p.highlights[0];
  host.style.setProperty("--cat", `var(--cat-${p.category[0]})`);
  host.innerHTML = `<span class="sign__bracket" aria-hidden="true"></span>
    <div class="sign__board">
      <p class="sign__label">Featured project</p>
      <p class="sign__title">${esc(p.title)}</p>
      <p class="sign__fig">${esc(h.value)}</p>
      <p class="sign__ctx">${esc(h.label)}: ${esc(h.context)}</p>
      <a class="sign__link" href="#project-${p.slug}">Read the project</a>
    </div>`;
}

/* ── Counters: everything derives from the data files ────────── */
function renderCounters() {
  const counts = countByCategory();
  const values = {
    all: counts.all,
    domains: domainCount(),
    highlights: PROJECTS.reduce((n, p) => n + p.highlights.length, 0),
    credentials: CREDENTIALS.length,
  };
  document.querySelectorAll("[data-count]").forEach((el) => {
    const v = values[el.dataset.count];
    if (v === undefined) return;
    if (el.hasAttribute("data-words")) {
      const w = WORDS[v] || String(v);
      const first = el.parentElement.firstElementChild === el && el.parentElement.textContent.trim().startsWith(el.textContent.trim());
      el.textContent = first ? w[0].toUpperCase() + w.slice(1) : w;
    } else el.textContent = String(v);
  });
  // Figures quoted outside the Work section are read from the data too.
  document.querySelectorAll("[data-hl], [data-hl-src]").forEach((el) => {
    const [slug, label] = (el.dataset.hl || el.dataset.hlSrc).split(":");
    const h = PROJECTS.find((p) => p.slug === slug)?.highlights.find((x) => x.label === label);
    if (h) el.textContent = el.dataset.hl ? h.value : h.source;
  });
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));
}

function renderFooter() {
  const host = document.getElementById("footer-projects");
  if (!host) return;
  host.innerHTML = PROJECTS.map((p) => `<li><a href="#project-${p.slug}">${esc(p.title)}</a></li>`).join("");
}

/* ── Credentials ──────────────────────────────────────────────── */
function mark(c) {
  const p = c.provider;
  if (p.logo) return `<span class="mark mark--logo"><img src="${esc(p.logo)}" alt="${esc(p.logoAlt || p.name + " logo")}" width="40" height="40"></span>`;
  return `<span class="mark mark--type" aria-hidden="true"><span>${esc(p.name)}</span></span>`;
}

function credMeta(c) {
  const rows = [];
  rows.push(`<div><dt>Provider</dt><dd>${esc(c.provider.name)}${c.issuer ? `, ${esc(c.issuer)}` : ""}</dd></div>`);
  if (c.date) rows.push(`<div><dt>Issued</dt><dd>${c.datetime ? `<time datetime="${esc(c.datetime)}">${esc(c.date)}</time>` : esc(c.date)}</dd></div>`);
  if (c.id) rows.push(`<div><dt>ID</dt><dd class="num">${esc(c.id)}</dd></div>`);
  if (c.ids) rows.push(`<div><dt>IDs</dt><dd class="num">${c.ids.map(esc).join("<br>")}</dd></div>`);
  if (c.verify) rows.push(`<div><dt>Verify</dt><dd><a href="${esc(c.verify)}" target="_blank" rel="noopener noreferrer">Open the record<span class="sr-only"> on ${esc(c.provider.name)} (opens in a new tab)</span></a></dd></div>`);
  return `<dl class="cred__meta">${rows.join("")}</dl>`;
}

function renderCredentials() {
  const host = document.getElementById("credential-groups");
  if (!host) return;
  const html = Object.entries(GROUPS).map(([key, label]) => {
    const items = CREDENTIALS.filter((c) => c.group === key);
    if (!items.length) return "";
    const li = items.map((c, i) => `<li class="cred cred--${key}" style="--tilt:${key === "competition" ? [-1.1, 0.8, -0.5][i % 3] : 0}deg">
        ${mark(c)}
        <div class="cred__body">
          <h4 class="cred__title">${esc(c.title)}</h4>
          <p class="cred__summary">${esc(c.summary)}</p>
          ${credMeta(c)}
        </div>
      </li>`).join("");
    return `<section class="niche niche--${key}" aria-labelledby="g-${key}">
        <h3 class="niche__title" id="g-${key}">${esc(label)}</h3>
        <ul class="niche__list">${li}</ul>
      </section>`;
  }).join("");
  host.innerHTML = html;
}

export function renderAll() {
  renderFeatured();
  renderFilters();
  renderBoards();
  renderCounters();
  renderFooter();
  renderCredentials();
}
