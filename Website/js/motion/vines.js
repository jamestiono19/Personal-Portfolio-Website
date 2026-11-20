// @ts-check
/* ════════════════════════════════════════════════════════════════
   vines.js — the living border on every section and card.

   For each [data-vine] host it injects one aria-hidden SVG holding:
     • a stem that follows the host's rounded border with a slight
       organic wobble (pathLength=1 so CSS can "grow" it with
       stroke-dashoffset when the host scrolls into view),
     • leaves and buds sprouting along it in growth order (--d),
     • a corner ornament top-left and bottom-right (data-orn:
       fern · monstera · branch · roots · bud).
   Geometry is rebuilt whenever the host resizes. Hover/focus glow and
   sway live in css/nature.css.
   ════════════════════════════════════════════════════════════════ */

import { calm, seeded, whenVisible } from "./utils.js";

const NS = "http://www.w3.org/2000/svg";
const INSET = 7;

/** Rounded-rectangle perimeter, clockwise from the top-left. */
function perimeter(w, h, r, ins) {
  const x0 = ins, y0 = ins, x1 = w - ins, y1 = h - ins;
  r = Math.max(0, Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2));
  const arc = (Math.PI / 2) * r;
  const segs = [
    { len: x1 - x0 - 2 * r, at: (s) => [x0 + r + s, y0, 1, 0] },
    { len: arc, at: (s) => { const a = -Math.PI / 2 + s / r; return [x1 - r + r * Math.cos(a), y0 + r + r * Math.sin(a), -Math.sin(a), Math.cos(a)]; } },
    { len: y1 - y0 - 2 * r, at: (s) => [x1, y0 + r + s, 0, 1] },
    { len: arc, at: (s) => { const a = s / r; return [x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a), -Math.sin(a), Math.cos(a)]; } },
    { len: x1 - x0 - 2 * r, at: (s) => [x1 - r - s, y1, -1, 0] },
    { len: arc, at: (s) => { const a = Math.PI / 2 + s / r; return [x0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a), -Math.sin(a), Math.cos(a)]; } },
    { len: y1 - y0 - 2 * r, at: (s) => [x0, y1 - r - s, 0, -1] },
    { len: arc, at: (s) => { const a = Math.PI + s / r; return [x0 + r + r * Math.cos(a), y0 + r + r * Math.sin(a), -Math.sin(a), Math.cos(a)]; } },
  ].filter((sg) => sg.len > 0.01);
  const total = segs.reduce((t, sg) => t + sg.len, 0);
  const at = (s) => {
    s = ((s % total) + total) % total;
    for (const sg of segs) {
      if (s <= sg.len) return sg.at(s);
      s -= sg.len;
    }
    return segs[segs.length - 1].at(segs[segs.length - 1].len);
  };
  return { total, at };
}

function el(name, attrs) {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
}

function build(host, svg, seed) {
  const w = host.clientWidth;
  const h = host.clientHeight;
  if (w < 40 || h < 40) return false;
  const radius = parseFloat(getComputedStyle(host).borderTopLeftRadius) || 24;
  const { total, at } = perimeter(w, h, radius - INSET * 0.6, INSET);
  const rand = seeded(seed);
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.replaceChildren();

  // Stem: sampled every 10px, nudged along the outward normal.
  const phase = rand() * 6.28;
  let d = "";
  for (let s = 0; s <= total; s += 10) {
    const [x, y, tx, ty] = at(s);
    const wob = 1.6 * Math.sin(s / 46 + phase) + 0.8 * Math.sin(s / 17 + phase * 2);
    d += `${s ? "L" : "M"}${(x + ty * wob).toFixed(1)} ${(y - tx * wob).toFixed(1)}`;
  }
  svg.appendChild(el("path", { class: "vine__stem", d: d + "Z", pathLength: 1 }));

  // Leaves and buds, denser on big hosts, sparser on phones.
  const small = window.innerWidth < 640;
  const gap = small ? [120, 210] : [80, 150];
  const leaves = el("g", { class: "vine__leaves" });
  let s = 40 + rand() * 40;
  let n = 0;
  while (s < total - 30) {
    const [x, y, tx, ty] = at(s);
    const back = rand() < 0.5 ? -1 : 1;                 // along or against the stem
    const lean = (0.25 + rand() * 0.45);                // outward tilt (rad)
    const ang = Math.atan2(ty * back * Math.cos(lean) - tx * Math.sin(lean), tx * back * Math.cos(lean) + ty * Math.sin(lean));
    const size = 0.75 + rand() * 0.55;
    const isBud = n % 5 === 4;
    const g = el("g", { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang * 180 / Math.PI).toFixed(1)}) scale(${size.toFixed(2)})` });
    const use = isBud
      ? el("use", { href: "#bud", x: -5, y: -9, width: 10, height: 12, class: "vine__leaf vine__bud", transform: "rotate(90)" })
      : el("use", { href: "#leaf", x: -1, y: -6, width: 18, height: 12, class: "vine__leaf" });
    use.setAttribute("style", `--d:${(s / total).toFixed(3)}`);
    g.appendChild(use);
    leaves.appendChild(g);
    s += gap[0] + rand() * (gap[1] - gap[0]);
    n++;
  }
  svg.appendChild(leaves);

  // Corner ornaments, unique per section.
  const orn = host.dataset.orn || "fern";
  const size = Math.min(64, w * 0.18, h * 0.3);
  const o = INSET - 4;
  const corners = host.dataset.ornCorners || "tl br";
  if (corners.includes("tl")) svg.appendChild(el("use", { href: `#orn-${orn}`, class: "vine__orn", x: o, y: o, width: size, height: size }));
  const br = el("g", { transform: `rotate(180 ${w - o - size / 2} ${h - o - size / 2})` });
  br.appendChild(el("use", { href: `#orn-${orn}`, class: "vine__orn", x: w - o - size, y: h - o - size, width: size, height: size }));
  if (corners.includes("br")) svg.appendChild(br);
  return true;
}

export function initVines() {
  const hosts = /** @type {HTMLElement[]} */ (Array.from(document.querySelectorAll("[data-vine]")));
  const ro = "ResizeObserver" in window ? new ResizeObserver((entries) => {
    entries.forEach((e) => {
      const host = /** @type {HTMLElement} */ (e.target);
      const svg = /** @type {SVGSVGElement|undefined} */ (/** @type {any} */ (host).__vine);
      if (svg) requestAnimationFrame(() => build(host, svg, /** @type {any} */ (host).__seed));
    });
  }) : null;

  hosts.forEach((host, i) => {
    const svg = /** @type {SVGSVGElement} */ (el("svg", { class: "vine", "aria-hidden": "true", focusable: "false", preserveAspectRatio: "none" }));
    /** @type {any} */ (host).__vine = svg;
    /** @type {any} */ (host).__seed = 1009 * (i + 7);
    host.appendChild(svg);
    build(host, svg, 1009 * (i + 7));
    ro?.observe(host);
    if (calm()) host.classList.add("is-grown");
    else whenVisible(host, () => host.classList.add("is-grown"), "0px 0px -18% 0px");
  });

  // The stack river draws itself the same way.
  const flow = document.querySelector(".flow");
  if (flow) {
    if (calm()) flow.classList.add("is-grown");
    else whenVisible(flow, () => flow.classList.add("is-grown"));
  }
}
