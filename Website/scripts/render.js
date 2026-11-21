/* ============================================================
   render.js: builds every data-driven part of the page from
   projects.js: project cards, filter tabs, counters, the hero
   featured card and the footer project list.
   ============================================================ */

import { PROJECTS, CATEGORIES, countByCategory, domainCount } from "./projects.js";

/** Photographic settings placed behind each cover, in rotation. */
const SETTINGS = ["path", "valley", "rays", "moss"];

const ICON_ARROW =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
const ICON_OUT =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11l6-6M6 5h5v5"/></svg>';

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/** Escape text before it goes into innerHTML. */
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const pad = (n) => String(n).padStart(2, "0");

/** <picture> with an optional WebP source. */
function picture(img, { lazy = true, cls = "" } = {}) {
  const attrs = `src="${esc(img.src)}" alt="${esc(img.alt)}" width="${img.width}" height="${img.height}" decoding="async"${lazy ? ' loading="lazy"' : ""}${cls ? ` class="${cls}"` : ""}`;
  if (!img.webp) return `<img ${attrs}>`;
  return `<picture><source srcset="${esc(img.webp)}" type="image/webp"><img ${attrs}></picture>`;
}

function coverKind(img) {
  if (img.kind === "chart") return "cover--chart";
  return img.height > img.width ? "cover--phone" : "cover--screen-wide";
}

function linkList(links) {
  if (!links.length) return '<span class="muted">No public link yet</span>';
  return links
    .map((l) => `<a class="textlink" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ${ICON_OUT}<span class="sr-only"> (opens in a new tab)</span></a>`)
    .join("");
}

function highlight(h, i) {
  return `<li class="hl rv" style="--i:${i}">
    <span class="hl__label mono">${esc(h.label)}</span>
    <strong class="hl__value">${esc(h.value)}</strong>
    <p class="hl__context">${esc(h.context)}</p>
    <span class="hl__source">${esc(h.source)}</span>
  </li>`;
}

/** One project card: A. cover, B. brief + narration, C. highlights. */
function card(p, i, total) {
  const setting = SETTINGS[i % SETTINGS.length];
  const primary = CATEGORIES[p.category[0]];
  const chart = p.chart
    ? `<figure class="exhibit${p.chart.height > p.chart.width ? " exhibit--phone" : ""} rv">
        <div class="exhibit__img">${picture(p.chart)}</div>
        <figcaption>${esc(p.chart.alt)}</figcaption>
      </figure>`
    : "";

  return `<article class="project glass lit" id="p-${esc(p.slug)}" data-cats="${esc(p.category.join(" "))}" aria-labelledby="t-${esc(p.slug)}">
    <figure class="cover ${coverKind(p.cover)} wipe">
      <div class="cover__bg" style="background-image:url('./Assets/photos/${setting}-960.webp')" aria-hidden="true"></div>
      <div class="cover__frame">${picture(p.cover)}</div>
      <figcaption class="cover__tag mono">Fig. ${pad(i + 1)} · ${esc(p.cover.kind === "chart" ? "Project output" : "Screen")}</figcaption>
    </figure>

    <div class="brief">
      <div class="brief__top mono">
        <span class="brief__index">${pad(i + 1)} / ${pad(total)}</span>
        <span class="brief__tag">${esc(primary)}</span>
        ${p.subtag ? `<span>${esc(p.subtag)}</span>` : ""}
      </div>
      <h3 class="brief__title" id="t-${esc(p.slug)}">${esc(p.title)}</h3>
      <dl class="facts">
        <dt class="mono">Year</dt><dd>${esc(p.year)}</dd>
        <dt class="mono">Role</dt><dd>${esc(p.role)}</dd>
        <dt class="mono">Duration</dt><dd>${esc(p.duration)}</dd>
        <dt class="mono">Status</dt><dd>${esc(p.status)}</dd>
      </dl>
      <p class="brief__narration">${esc(p.narration)}</p>
      <div class="notes">
        <div class="note"><h4 class="mono">Problem</h4><p>${esc(p.problem)}</p></div>
        <div class="note"><h4 class="mono">${esc(p.solutionLabel || "Solution")}</h4><p>${esc(p.solution)}</p></div>
      </div>
      <div class="brief__links">${linkList(p.links)}</div>
    </div>

    <div class="highlights">
      <div class="highlights__head mono">
        <span>Highlights · ${pad(p.highlights.length)} findings</span>
        <span>Under each figure: the file it was read from</span>
      </div>
      <ul class="hl-grid${chart ? "" : " hl-grid--wide"}">${p.highlights.map(highlight).join("")}</ul>
      ${chart}
      <ul class="chips" aria-label="Stack">${p.stack.map((s) => `<li class="chip">${esc(s)}</li>`).join("")}</ul>
    </div>
  </article>`;
}

function filters(counts) {
  const tabs = [["all", "All"], ...Object.entries(CATEGORIES)];
  return tabs
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) =>
      `<button type="button" class="filter" data-filter="${key}" aria-pressed="${key === "all"}">${esc(label)} <sup>${pad(counts[key])}</sup></button>`)
    .join("");
}

function featured(p) {
  return `<a class="featured glass lit" href="#p-${esc(p.slug)}">
    <div class="featured__img">${picture(p.cover, { lazy: false })}</div>
    <div class="featured__body">
      <div><span class="mono">Latest · ${esc(p.year)}</span><span class="featured__title">${esc(p.title)}</span></div>
      <span class="featured__arrow" aria-hidden="true">${ICON_ARROW}</span>
    </div>
  </a>`;
}

/** Render everything. Returns the counts so other modules can use them. */
export function renderAll(root = document) {
  const counts = countByCategory();
  const total = PROJECTS.length;

  const list = root.querySelector("#projects");
  if (list) list.innerHTML = PROJECTS.map((p, i) => card(p, i, total)).join("");

  const tabs = root.querySelector("#filters");
  if (tabs) tabs.innerHTML = filters(counts);

  const feat = root.querySelector("#featured");
  const pick = PROJECTS.find((p) => p.featured) || PROJECTS[0];
  if (feat && pick) feat.innerHTML = featured(pick);

  const figures = PROJECTS.reduce((n, p) => n + p.highlights.length, 0);
  root.querySelectorAll("[data-count]").forEach((el) => {
    const key = el.dataset.count;
    const n = key === "domains" ? domainCount() : key === "highlights" ? figures : counts[key] ?? 0;
    el.textContent = el.hasAttribute("data-words") ? WORDS[n] || String(n) : pad(n);
  });

  // Figures quoted outside the Work section are read from the same highlights.
  const findHl = (ref) => {
    const [slug, label] = ref.split(":");
    const p = PROJECTS.find((x) => x.slug === slug);
    return p && p.highlights.find((h) => h.label === label);
  };
  root.querySelectorAll("[data-hl]").forEach((el) => { const h = findHl(el.dataset.hl); if (h) el.textContent = h.value; });
  root.querySelectorAll("[data-hl-src]").forEach((el) => { const h = findHl(el.dataset.hlSrc); if (h) el.textContent = h.source; });

  const foot = root.querySelector("#footer-projects");
  if (foot) foot.innerHTML = PROJECTS.map((p) => `<li><a href="#p-${esc(p.slug)}">${esc(p.title)}</a></li>`).join("");

  return { counts, total };
}

/** Filter tabs: fade cards out, swap visibility, fade the rest in. */
export function bindFilters(root = document) {
  const tabs = root.querySelector("#filters");
  const status = root.querySelector("#filter-status");
  if (!tabs) return;
  const cards = [...root.querySelectorAll(".project")];
  let timer;

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn || btn.getAttribute("aria-pressed") === "true") return;
    tabs.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    const key = btn.dataset.filter;
    const show = (c) => key === "all" || c.dataset.cats.split(" ").includes(key);

    cards.forEach((c) => c.classList.add("is-leaving"));
    clearTimeout(timer);
    timer = setTimeout(() => {
      let n = 0;
      cards.forEach((c) => {
        const on = show(c);
        c.hidden = !on;
        if (on) n++;
      });
      requestAnimationFrame(() => cards.forEach((c) => c.classList.remove("is-leaving")));
      if (status) status.textContent = `Showing ${n} of ${cards.length} projects`;
      window.dispatchEvent(new Event("layoutchange"));
    }, 260);
  });
}
