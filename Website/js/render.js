// @ts-check
/* ════════════════════════════════════════════════════════════════
   render.js — builds everything project-driven from js/data/projects.js:
   hero stats + featured card, the Work intro sentence, filter tabs
   with counts, the case studies (A. brief, B. highlights) and the
   footer's project links.
   ════════════════════════════════════════════════════════════════ */

import { projects, CATEGORY_LABELS, CATEGORY_ORDER } from "./data/projects.js";

/** @typedef {import("./data/projects.js").Project} Project */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
const pad = (n) => String(n).padStart(2, "0");
const icon = (id) => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#${id}"/></svg>`;
const ext = (href) => /^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";

/** Number of projects in each category (a project can sit in several). */
export function categoryCounts() {
  /** @type {Record<string, number>} */
  const counts = {};
  CATEGORY_ORDER.forEach((c) => { counts[c] = projects.filter((p) => p.category.includes(c)).length; });
  return counts;
}

const listJoin = (items) => items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** <picture> for a cover, AVIF first, WebP fallback. */
function picture(cover, sizes, eager = false) {
  const set = (fmt) => cover.widths.map((w) => `${cover.base}-${w}.${fmt} ${w}w`).join(", ");
  const largest = cover.widths[cover.widths.length - 1];
  return `<picture>
    <source type="image/avif" srcset="${set("avif")}" sizes="${sizes}">
    <img src="${cover.base}-${largest}.webp" srcset="${set("webp")}" sizes="${sizes}" alt="${esc(cover.alt)}"
         width="${cover.width}" height="${cover.height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
  </picture>`;
}

/** Bar chart, drawn as stems that grow with a leaf at the tip. */
function chart(c) {
  const max = c.max ?? Math.max(...c.data.map((d) => d.value));
  const peak = c.data[c.data.length - 1].value === Math.max(...c.data.map((d) => d.value)) && c.data.length > 2;
  const rows = c.data.map((d, n) => `
      <div class="chart__row">
        <span class="chart__label">${esc(d.label)}</span>
        <span class="chart__track" aria-hidden="true"><span class="chart__stem" style="--v:${(d.value / max).toFixed(4)};--n:${n}"></span></span>
        <span class="chart__val">${c.digits != null ? d.value.toFixed(c.digits) : d.value}${c.unit ? esc(c.unit) : ""}</span>
      </div>`).join("");
  return `<li class="hl hl--chart">
      <figure class="chart${peak ? " chart--peak" : ""}">
        <figcaption><span>${esc(c.title)}</span><span class="datatag">${esc(c.source)}</span></figcaption>
        <div class="chart__rows">${rows}</div>
      </figure>
    </li>`;
}

/** A. Brief and narration + B. Highlights, for one project. */
function caseCard(/** @type {Project} */ p, i) {
  const primary = p.links[0];
  const tags = p.category.map((c) => `<li class="tag tag--${c}">${esc(CATEGORY_LABELS[c])}</li>`).join("");
  const facts = [p.year ?? "Year to confirm", p.role, p.duration].map((f) => `<li>${esc(f)}</li>`).join("");
  const links = p.links.map((l, n) => `
      <a class="pill pill--sm ${n ? "pill--ink" : ""}" href="${esc(l.href)}"${ext(l.href)}>${esc(l.label)}
        <span class="pill__icon" aria-hidden="true">${icon("i-arrow")}</span>
      </a>`).join("");

  const coverInner = `${picture(p.cover, "(min-width: 1100px) 56vw, 100vw")}
      <span class="case__index mono">${pad(i + 1)}</span>
      ${primary ? `<span class="case__open" aria-hidden="true">${esc(primary.label)} ${icon("i-arrow")}</span>` : ""}`;
  const cover = primary
    ? `<a class="case__cover" href="${esc(primary.href)}"${ext(primary.href)} aria-label="${esc(primary.label)}: ${esc(p.title)}">${coverInner}</a>`
    : `<div class="case__cover case__cover--pending">${coverInner}</div>`;

  const sources = [...new Set([...p.highlights.map((h) => h.source), ...(p.chart ? [p.chart.source] : [])])];
  const hl = p.pending
    ? `<li class="hl hl--pending">
         <svg width="34" height="34" viewBox="-5 -9 10 12" aria-hidden="true" style="color:var(--leaf-deep)"><use href="#bud"/></svg>
         <p>Highlights are being extracted from this project’s notebooks and logs. No figure appears here until it has been verified from the source files.</p>
       </li>`
    : p.highlights.map((h) => `
      <li class="hl">
        <span class="hl__label mono">${esc(h.label)}</span>
        <span class="hl__value" data-count>${esc(h.value)}${h.unit ? `<small>${esc(h.unit)}</small>` : ""}</span>
        <p class="hl__context">${esc(h.context)}</p>
        <span class="hl__src datatag" title="Source">${esc(h.source)}</span>
      </li>`).join("") + (p.chart ? chart(p.chart) : "");

  const stack = p.stack.length
    ? `<div class="case__stack"><span class="mono">Stack</span><ul class="chips">${p.stack.map((s) => `<li class="chip">${esc(s)}</li>`).join("")}</ul></div>`
    : "";

  return `
  <article class="case glass glass--light glass--strong on-light beam" id="project-${esc(p.slug)}"
           data-cats="${p.category.join(" ")}" data-vine data-orn="${esc(p.ornament || "fern")}" aria-labelledby="t-${esc(p.slug)}">
    <div class="case__brief">
      ${cover}
      <div class="case__body">
        <ul class="case__tags" aria-label="Categories">${tags}</ul>
        <h3 class="case__title display" id="t-${esc(p.slug)}">${esc(p.title)}</h3>
        <ul class="case__facts mono">${facts}</ul>
        <p class="case__narration">${esc(p.narration)}</p>
        <div class="case__notes">
          <div class="note"><h4 class="mono">${esc(p.problem.label)}</h4><p>${esc(p.problem.text)}</p></div>
          <div class="note"><h4 class="mono">${esc(p.solution.label)}</h4><p>${esc(p.solution.text)}</p></div>
        </div>
        ${links ? `<div class="case__links">${links}</div>` : ""}
      </div>
    </div>
    <div class="case__highlights">
      <div class="case__hhead">
        <h4 class="mono"><svg viewBox="-1 -6 18 12" aria-hidden="true"><use href="#leaf"/></svg>Highlights</h4>
        ${sources.length ? `<p class="mono">Sources · ${sources.map(esc).join(" · ")}</p>` : ""}
      </div>
      <ul class="hl-grid">${hl}</ul>
      ${stack}
    </div>
  </article>`;
}

export function renderProjects() {
  const counts = categoryCounts();
  const domains = CATEGORY_ORDER.filter((c) => counts[c] > 0);

  // Hero stats
  const set = (sel, v) => document.querySelectorAll(sel).forEach((el) => { el.textContent = String(v); });
  set('[data-stat="projects"]', projects.length);
  set('[data-stat="domains"]', domains.length);

  // Work intro sentence
  const copy = document.getElementById("work-copy");
  if (copy) {
    copy.textContent = `${projects.length} projects across ${listJoin(domains.map((c) => CATEGORY_LABELS[c].toLowerCase()))}. ` +
      "Each one turns a messy problem into something people can actually use.";
  }

  // Filter tabs with counts
  const filters = document.getElementById("filters");
  if (filters) {
    const btn = (key, label, n) =>
      `<button type="button" class="filter" data-filter="${key}" aria-pressed="${key === "all"}"${n ? "" : " disabled"}>${esc(label)}<sup>${n}</sup></button>`;
    filters.innerHTML = btn("all", "All", projects.length) + CATEGORY_ORDER.map((c) => btn(c, CATEGORY_LABELS[c], counts[c])).join("");
  }
  const status = document.getElementById("filters-status");
  if (status) status.textContent = `Showing all ${projects.length} projects`;

  // Case studies
  const cases = document.getElementById("cases");
  if (cases) cases.innerHTML = projects.map(caseCard).join("");

  // Hero featured card
  const featured = projects.find((p) => p.featured) || projects[projects.length - 1];
  const feat = document.getElementById("hero-feature");
  if (feat && featured) {
    feat.setAttribute("href", `#project-${featured.slug}`);
    const thumb = feat.querySelector(".feature__thumb");
    if (thumb) thumb.innerHTML = picture(featured.cover, "88px", true).replace(/ alt="[^"]*"/, ' alt=""');
    const title = feat.querySelector(".feature__title");
    if (title) title.textContent = featured.title;
    const kicker = feat.querySelector(".feature__kicker");
    if (kicker) kicker.textContent = `Latest work · ${featured.year ?? ""}`.trim();
  }

  // Footer project links
  const foot = document.getElementById("footer-projects");
  if (foot) foot.innerHTML = projects.map((p) => `<li><a href="#project-${esc(p.slug)}">${esc(p.title)}</a></li>`).join("");
}
