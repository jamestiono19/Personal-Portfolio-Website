// @ts-check
/* ════════════════════════════════════════════════════════════════
   scroll.js — smooth scroll and the scroll-linked "camera".
     smooth     Lenis, synced to GSAP's ticker and ScrollTrigger
     dolly      each [data-dolly] section pushes in slightly as it
                enters, so scrolling feels like walking further in
     ripen      the statement's muted half ripens word by word
     reveals    .reveal elements fade up once (IntersectionObserver)
     figures    numeric highlights count up; charts grow their stems
   Everything degrades: no GSAP → reveals/figures still work; reduced
   motion → no smoothing, no dolly, the statement is fully ripe.
   ════════════════════════════════════════════════════════════════ */

import { $$, calm, whenVisible } from "./utils.js";

function splitWords(el) {
  const text = el.textContent || "";
  el.textContent = "";
  text.trim().split(/\s+/).forEach((w, i) => {
    if (i) el.appendChild(document.createTextNode(" "));
    const s = document.createElement("span");
    s.className = "w";
    s.textContent = w;
    el.appendChild(s);
  });
  return $$(".w", el);
}

function reveals() {
  const items = $$(".reveal");
  if (calm() || !("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  items.forEach((el) => io.observe(el));
}

/** Count numeric highlight values up from zero, keeping their decimals. */
function figures() {
  $$("[data-count]").forEach((el) => {
    const node = el.firstChild;
    if (!node || node.nodeType !== 3) return;
    const raw = (node.textContent || "").trim();
    if (!/^\d+(\.\d+)?$/.test(raw)) return;           // "r 0.81", "Free" … stay as written
    const target = parseFloat(raw);
    const decimals = (raw.split(".")[1] || "").length;
    if (calm()) return;
    whenVisible(el, () => {
      const t0 = performance.now();
      const dur = 1400;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        node.textContent = (target * e).toFixed(decimals);
        if (k < 1) requestAnimationFrame(step); else node.textContent = raw;
      };
      requestAnimationFrame(step);
    });
  });
  $$(".chart").forEach((c) => {
    if (calm()) c.classList.add("is-in");
    else whenVisible(c, () => c.classList.add("is-in"));
  });
}

/**
 * @param {{ gsap: any, ScrollTrigger: any, Lenis: any } | null} libs
 */
export function initScroll(libs) {
  reveals();
  figures();

  const muted = document.querySelector(".statement__muted");
  const words = muted ? splitWords(muted) : [];

  if (!libs || calm()) {
    words.forEach((w) => w.classList.add("is-ripe"));
    return;
  }
  const { gsap, ScrollTrigger, Lenis } = libs;
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync.
  if (Lenis) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.9 });
    /** @type {any} */ (window).__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Camera dolly: sections ease forward out of the haze as they enter.
  $$("[data-dolly]").forEach((el) => {
    gsap.fromTo(el,
      { scale: 0.94, yPercent: 3, opacity: 0.55, transformOrigin: "50% 0%" },
      { scale: 1, yPercent: 0, opacity: 1, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "top 55%", scrub: 0.6 } });
  });

  // The hero recedes as you leave it (the camera moves past it).
  const hero = document.getElementById("hero-frame");
  if (hero) {
    gsap.to(hero, { scale: 0.95, opacity: 0.6, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } });
  }

  // Statement: the muted half ripens word by word with scroll.
  if (words.length && muted) {
    ScrollTrigger.create({
      trigger: muted, start: "top 80%", end: "bottom 45%", scrub: true,
      onUpdate: (self) => {
        const n = Math.round(self.progress * words.length);
        words.forEach((w, i) => w.classList.toggle("is-ripe", i < n));
      },
    });
  }

  // Layout changes (filters, images, fonts) → recalculate triggers.
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("layout-change", () => setTimeout(refresh, 650));
  window.addEventListener("load", refresh);
  document.fonts?.ready.then(refresh);
}
