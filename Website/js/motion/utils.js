// @ts-check
/* ════════════════════════════════════════════════════════════════
   utils.js — small animation helpers shared by the motion modules.
   ════════════════════════════════════════════════════════════════ */

export const $ = (sel, root = document) => /** @type {HTMLElement|null} */ (root.querySelector(sel));
export const $$ = (sel, root = document) => /** @type {HTMLElement[]} */ (Array.from(root.querySelectorAll(sel)));

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;

const rmQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
/** True when the visitor asked for reduced motion (re-read on every call). */
export const calm = () => rmQuery.matches;
export const onCalmChange = (fn) => rmQuery.addEventListener?.("change", fn);

/** Desktop-class pointer: a mouse or trackpad that can hover. */
export const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Small deterministic PRNG so vines grow the same way on every load. */
export function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

/** Load a classic script once; resolves when it has run. */
const loaded = new Map();
export function loadScript(src) {
  if (!loaded.has(src)) {
    loaded.set(src, new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve(undefined);
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    }));
  }
  return loaded.get(src);
}

/** Resolve after `ms`, or immediately when the promise settles first. */
export const timeout = (promise, ms) =>
  Promise.race([promise, new Promise((r) => setTimeout(r, ms))]);

/** Run `fn` when `el` first scrolls into view (once). */
export function whenVisible(el, fn, rootMargin = "0px 0px -12% 0px") {
  if (!("IntersectionObserver" in window)) { fn(); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { io.disconnect(); fn(); }
    });
  }, { rootMargin });
  io.observe(el);
}
