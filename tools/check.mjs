#!/usr/bin/env node
/* ============================================================
   check.mjs: the site's "build": there is no bundler, so this
   is the gate that must pass before a push.

   1. Every JS module parses.
   2. scripts/projects.js matches its schema: known categories,
      every required field filled, every highlight carries a
      source, no empty slots.
   3. Every cover/chart file exists.
   4. Every local src / href / srcset / url() in index.html and
      the stylesheets resolves to a real file.

   Usage: node tools/check.mjs        (exit code 1 on any error)
   ============================================================ */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "Website");
const errors = [];
const fail = (msg) => errors.push(msg);

// 1. Modules parse
for (const f of readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".js"))) {
  try { execFileSync(process.execPath, ["--check", join(root, "scripts", f)], { stdio: "pipe" }); }
  catch (e) { fail(`scripts/${f} does not parse: ${e.stderr}`); }
}

// 2. Data schema
const { PROJECTS, CATEGORIES } = await import(pathToFileURL(join(root, "scripts", "projects.js")).href);
const required = ["slug", "title", "year", "role", "duration", "status", "narration", "problem", "solution"];
const slugs = new Set();
for (const p of PROJECTS) {
  const at = `project "${p.slug || p.title}"`;
  required.forEach((k) => { if (!String(p[k] ?? "").trim()) fail(`${at}: empty ${k}`); });
  if (slugs.has(p.slug)) fail(`${at}: duplicate slug`);
  slugs.add(p.slug);
  if (!p.category?.length) fail(`${at}: no category`);
  p.category?.forEach((c) => { if (!CATEGORIES[c]) fail(`${at}: unknown category "${c}"`); });
  if (!p.stack?.length) fail(`${at}: empty stack`);
  if (!p.highlights?.length) fail(`${at}: no highlights`);
  p.highlights?.forEach((h, i) => {
    ["label", "value", "context", "source"].forEach((k) => {
      if (!String(h[k] ?? "").trim()) fail(`${at}: highlight ${i + 1} has no ${k}`);
    });
  });
  [p.cover, p.chart].filter(Boolean).forEach((img) => {
    [img.src, img.webp].filter(Boolean).forEach((src) => {
      if (!existsSync(join(root, src))) fail(`${at}: missing image ${src}`);
    });
    if (!img.alt?.trim()) fail(`${at}: image without alt text`);
  });
}

// 3/4. Local references in HTML and CSS
const refs = (text) => {
  const out = [];
  for (const m of text.matchAll(/(?<![\w-])(?:src|href)="([^"]+)"/g)) out.push(m[1]);
  for (const m of text.matchAll(/(?:srcset|imagesrcset)="([^"]+)"/g))
    m[1].split(",").forEach((part) => out.push(part.trim().split(/\s+/)[0]));
  for (const m of text.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) out.push(m[1]);
  return out.filter((r) => r && !/^(https?:|mailto:|data:|#|%23)/.test(r));
};
const check = (file, base) => {
  for (const r of refs(readFileSync(file, "utf8"))) {
    const path = join(base, decodeURI(r.split(/[?#]/)[0]));
    if (!existsSync(path)) fail(`${file.replace(root, "Website")}: broken reference ${r}`);
  }
};
check(join(root, "index.html"), root);

// 5. Figures quoted outside the Work section must point at a real highlight
const html = readFileSync(join(root, "index.html"), "utf8");
for (const m of html.matchAll(/data-hl(?:-src)?="([^"]+)"/g)) {
  const [slug, label] = m[1].split(":");
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p || !p.highlights.some((h) => h.label === label)) fail(`index.html: data-hl "${m[1]}" matches no highlight`);
}
for (const f of readdirSync(join(root, "styles"))) check(join(root, "styles", f), join(root, "styles"));

// 6. Credentials: every entry names its file; logos only where one exists locally
const { CREDENTIALS, GROUPS } = await import(pathToFileURL(join(root, "scripts", "credentials.js")).href);
for (const c of CREDENTIALS) {
  const at = `credential "${c.title}"`;
  ["title", "summary", "file"].forEach((k) => { if (!String(c[k] ?? "").trim()) fail(`${at}: empty ${k}`); });
  if (!GROUPS[c.group]) fail(`${at}: unknown group "${c.group}"`);
  if (!c.provider?.name) fail(`${at}: no provider name`);
  if (c.provider?.logo && !existsSync(join(root, c.provider.logo))) fail(`${at}: missing logo ${c.provider.logo}`);
  if (c.provider?.logo && !c.provider.logoAlt) fail(`${at}: logo without alt text`);
}

// 7. House style: banned faces and the typographic tells listed in design-system.md
const banned = /\b(Inter|Geist|Instrument Serif|Fraunces|Cormorant|Playfair|Cinzel|MedievalSharp|Uncial Antiqua|Pirata One)\b/;
const texts = {
  "index.html": html,
  ...Object.fromEntries(readdirSync(join(root, "styles")).map((f) => [`styles/${f}`, readFileSync(join(root, "styles", f), "utf8")])),
  "scripts/projects.js": readFileSync(join(root, "scripts", "projects.js"), "utf8"),
  "scripts/credentials.js": readFileSync(join(root, "scripts", "credentials.js"), "utf8"),
};
for (const [name, text] of Object.entries(texts)) {
  if (banned.test(text)) fail(`${name}: uses a banned typeface (${text.match(banned)[0]})`);
  if (!name.startsWith("styles/") && /\u00B7|\u2192|\u2194|\u2248/.test(text)) fail(`${name}: contains a middle dot or arrow character`);
  if (/fonts\.googleapis|cdn\.jsdelivr|unpkg\.com/.test(text)) fail(`${name}: loads from a third-party CDN; self-host instead`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
const highlights = PROJECTS.reduce((n, p) => n + p.highlights.length, 0);
console.log(`✓ ${PROJECTS.length} projects, ${highlights} sourced highlights, ${CREDENTIALS.length} credentials, all modules parse, all local references resolve, house style holds`);
