// check.mjs — the site's "build" check (there is no bundler: the site is
// static). Run from the repo root:   node tools/check.mjs
//
//  1. every JS file parses (node --check)
//  2. js/data/projects.js matches its schema: categories are known, every
//     highlight names a source, pending projects carry no figures
//  3. every cover width/format listed in the data exists on disk
//  4. every local src/href/srcset in index.html and url() in CSS resolves
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";

const site = resolve(dirname(new URL(import.meta.url).pathname), "..", "Website");
let errors = 0;
const fail = (m) => { errors++; console.error("✗", m); };
const ok = (m) => console.log("✓", m);

// 1. syntax
const jsFiles = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith(".js") && !p.includes("/vendor/") && jsFiles.push(p); });
walk(join(site, "js"));
for (const f of jsFiles) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); } catch (e) { fail(`syntax: ${f}\n${e.stderr}`); }
}
ok(`${jsFiles.length} modules parse`);

// 2. data schema
const src = readFileSync(join(site, "js/data/projects.js"), "utf8");
const { projects, CATEGORY_LABELS } = await import("data:text/javascript," + encodeURIComponent(src));
const slugs = new Set();
for (const p of projects) {
  const where = `project "${p.slug}"`;
  for (const k of ["slug", "title", "category", "role", "duration", "cover", "narration", "problem", "solution", "links", "stack", "highlights"]) {
    if (p[k] === undefined) fail(`${where}: missing ${k}`);
  }
  if (slugs.has(p.slug)) fail(`${where}: duplicate slug`); slugs.add(p.slug);
  if (!p.category.length) fail(`${where}: no category`);
  p.category.forEach((c) => CATEGORY_LABELS[c] || fail(`${where}: unknown category ${c}`));
  p.highlights.forEach((h, i) => {
    if (!h.label || !h.value || !h.context) fail(`${where}: highlight ${i} incomplete`);
    if (!h.source) fail(`${where}: highlight "${h.label}" has no source`);
  });
  if (p.chart && !p.chart.source) fail(`${where}: chart has no source`);
  if (p.pending && (p.highlights.length || p.chart)) fail(`${where}: pending projects must not show figures`);
  if (!p.pending && p.highlights.length < 3) fail(`${where}: needs at least 3 highlights`);
  // 3. cover files
  for (const w of p.cover.widths) for (const ext of ["webp", "avif"]) {
    const f = join(site, p.cover.base.replace("./", "") + `-${w}.${ext}`);
    if (!existsSync(f)) fail(`${where}: missing cover ${f}`);
  }
}
ok(`${projects.length} projects valid (${projects.filter((p) => p.pending).length} pending)`);

// 4. local references
const html = readFileSync(join(site, "index.html"), "utf8");
const refs = new Set();
for (const m of html.matchAll(/(?:src|href|srcset|imagesrcset)="([^"]+)"/g)) {
  m[1].split(",").forEach((part) => { const u = part.trim().split(/\s+/)[0]; if (u.startsWith("./")) refs.add(u); });
}
for (const m of html.matchAll(/"\.\/Assets\/scenery\/" \+ "([^ "]+)/g)) refs.add("./Assets/scenery/" + m[1]);
for (const css of readdirSync(join(site, "css"))) {
  const text = readFileSync(join(site, "css", css), "utf8");
  for (const m of text.matchAll(/url\("?(\.\.\/[^")]+)"?\)/g)) refs.add("./" + m[1].slice(3));
}
for (const r of refs) if (!existsSync(join(site, decodeURIComponent(r.replace("./", ""))))) fail(`missing file referenced: ${r}`);
ok(`${refs.size} local references resolve`);

if (errors) { console.error(`\n${errors} problem(s)`); process.exit(1); }
console.log("\nAll checks passed.");
