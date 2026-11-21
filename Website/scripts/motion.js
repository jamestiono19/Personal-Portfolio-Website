/* ============================================================
   motion.js: the castle gate, and the few motions that answer
   the visitor.

   One orchestrated moment: the gate (GSAP, loaded only when the
   gate plays). Continuous: hero parallax, the sky warming from
   morning to late afternoon down the page, bunting that sways
   with scroll speed. Two scroll-triggered effects: the statement
   lighting up word by word, and the banner that drops away from
   each project cover. Everything else answers hover and focus.
   Only transform and opacity are animated.
   ============================================================ */

export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const html = document.documentElement;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ── Gate: loading, then the way in ───────────────────────────── */
export function runGate({ onDone }) {
  const gate = document.getElementById("gate");
  const finish = () => {
    if (gate) {
      gate.hidden = true;
      gate.setAttribute("aria-hidden", "true");
    }
    html.classList.remove("gate-on");
    html.classList.add("no-gate", "entered");
    try { sessionStorage.setItem("jt-gate", "1"); } catch (e) { /* private mode */ }
    onDone && onDone(true);
  };
  if (!gate || html.classList.contains("no-gate")) { gate && (gate.hidden = true); html.classList.add("entered"); onDone && onDone(false); return; }

  const countEl = gate.querySelector("[data-gate-count]");
  const status = gate.querySelector(".gate__status");
  const prompt = gate.querySelector("[data-gate-prompt]");
  const enterBtn = gate.querySelector("[data-gate-enter]");
  const skipBtn = gate.querySelector("[data-gate-skip]");
  const grille = gate.querySelector(".gate__grille");
  let shown = 0;
  let target = 0;
  let ready = false;
  let entering = false;

  // Real milestones: fonts, the gate art itself, then each hero layer.
  const imgs = [...gate.querySelectorAll("img"), ...document.querySelectorAll("[data-milestone]")];
  const steps = [document.fonts ? document.fonts.ready : Promise.resolve(), ...imgs.map((img) =>
    (img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); }))
      .then(() => (img.decode ? img.decode().catch(() => {}) : null)))];
  let done = 0;
  steps.forEach((p) => p.then(() => { done += 1; target = Math.round((done / steps.length) * 100); }));
  // Never hold anyone at the gate for more than 8 s on a slow link.
  const giveUp = setTimeout(() => { target = 100; }, 8000);

  // Counter and portcullis follow the milestones; the portcullis rises
  // in steps (one per milestone), never past 60% until the visitor enters.
  const tick = () => {
    if (shown < target) shown = Math.min(target, shown + Math.max(1, Math.ceil((target - shown) / 6)));
    countEl.textContent = String(shown).padStart(2, "0");
    const stepH = Math.floor((shown / 100) * steps.length) / steps.length;
    grille.style.transform = `translateY(${(-stepH * 520).toFixed(0)}px)`;
    if (shown >= 100 && !ready) { ready = true; clearTimeout(giveUp); onReady(); }
    if (!entering) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  function onReady() {
    status.textContent = "The gate is open. Press Enter, click or scroll to go in.";
    prompt.hidden = false;
    enterBtn.focus({ preventScroll: true });
    gate.addEventListener("click", (e) => { if (!e.target.closest("[data-gate-skip]")) enter(); });
    gate.addEventListener("wheel", enter, { passive: true });
    gate.addEventListener("touchmove", enter, { passive: true });
  }

  function onKey(e) {
    if (e.key === "Enter" && ready) { e.preventDefault(); enter(); }
    if (e.key === "Escape") skip();
    // Keep focus inside the gate while it is a modal dialog.
    if (e.key === "Tab") {
      const f = [...gate.querySelectorAll("button:not([hidden])")].filter((b) => !b.closest("[hidden]"));
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }
  document.addEventListener("keydown", onKey);
  skipBtn.addEventListener("click", (e) => { e.stopPropagation(); skip(); });
  skipBtn.focus({ preventScroll: true });

  function skip() {
    if (entering) return;
    entering = true;
    document.removeEventListener("keydown", onKey);
    gate.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: "ease-out" }).finished.then(finish);
  }

  async function enter() {
    if (entering) return;
    entering = true;
    document.removeEventListener("keydown", onKey);
    if (reduced) {
      gate.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: "ease-out" }).finished.then(finish);
      return;
    }
    const { gsap } = await import("./vendor/gsap.js");
    const rig = gate.querySelector(".gate__rig");
    const doorL = gate.querySelector(".gate__door--l");
    const doorR = gate.querySelector(".gate__door--r");
    const seam = gate.querySelector(".gate__light");
    const ui = gate.querySelectorAll(".gate__ui, .gate__skip");
    const scene = document.querySelector(".hero .scene");
    const heroIn = document.querySelectorAll("[data-enter]");

    gsap.set(heroIn, { opacity: 0, y: 26 });
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(ui, { opacity: 0, duration: 0.3, ease: "power1.out" }, 0)
      // Portcullis: the last stretch, with a short iron bounce at the top
      .to(grille, { y: -1220, duration: 0.7, ease: "back.out(1.6)" }, 0)
      // Doors swing inward on their outer hinges
      .to(doorL, { rotateY: 100, duration: 1.6, ease: "power3.inOut" }, 0.5)
      .to(doorR, { rotateY: -100, duration: 1.6, ease: "power3.inOut" }, 0.5)
      .fromTo(seam, { scaleX: 0.02, opacity: 0.9 }, { scaleX: 1, opacity: 1, duration: 1.5, ease: "power2.inOut" }, 0.55)
      // A short shake as the bar lifts and the leaves start to move
      .to(rig, { keyframes: [{ x: -4, y: 2 }, { x: 3, y: -2 }, { x: -2, y: 1 }, { x: 0, y: 0 }], duration: 0.35, ease: "none" }, 0.5)
      // Camera dolly through the gate while the lane settles into place
      .to(rig, { scale: 2.6, duration: 1.8, ease: "power2.in" }, 0.9)
      .to(gate, { opacity: 0, duration: 0.6, ease: "power1.in" }, 2.1);
    if (scene) tl.fromTo(scene, { scale: 1.15 }, { scale: 1, duration: 1.8, ease: "power2.out", clearProps: "transform" }, 0.9);
    tl.to(heroIn, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", clearProps: "transform,opacity" }, 2.2);
  }
}

/* ── Bunting: flags generated along the cord, swayed by scroll ── */
const FLAG_COLOURS = ["#A8392B", "#E6D9BC", "#5D7A3A", "#C8922A", "#3C6A8C", "#C4513A"];

export function buildBunting() {
  const g = document.querySelector(".bunting__flags");
  if (!g) return [];
  // Cord: M-10 18 Q800 104 1610 30
  const at = (t) => {
    const x = (1 - t) ** 2 * -10 + 2 * (1 - t) * t * 800 + t * t * 1610;
    const y = (1 - t) ** 2 * 18 + 2 * (1 - t) * t * 104 + t * t * 30;
    return [x, y];
  };
  const n = 22;
  let out = "";
  for (let i = 0; i < n; i += 1) {
    const [x0, y0] = at((i + 0.12) / n);
    const [x1, y1] = at((i + 0.88) / n);
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    const c = FLAG_COLOURS[i % FLAG_COLOURS.length];
    const len = 46 + ((i * 7) % 3) * 4;
    out += `<g class="flag" style="transform-origin:${mx.toFixed(1)}px ${my.toFixed(1)}px;--k:${(0.7 + (i % 4) * 0.12).toFixed(2)};animation-delay:${(-i * 0.37).toFixed(2)}s">
      <path d="M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}L${(mx + 1.5).toFixed(1)} ${(my + len).toFixed(1)}Z" fill="${c}"/>
      <path d="M${mx.toFixed(1)} ${my.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}L${(mx + 1.5).toFixed(1)} ${(my + len).toFixed(1)}Z" fill="#1c1a17" opacity=".14"/>
    </g>`;
  }
  g.innerHTML = out;
}

/* ── Continuous scroll: parallax, sky warmth, bunting sway ────── */
export function bindScroll() {
  const layers = [...document.querySelectorAll(".scene__layer[data-depth]")];
  const hero = document.querySelector(".hero");
  const group = document.querySelector(".bunting__flags");
  buildBunting();
  if (reduced) { html.style.setProperty("--day", "0.5"); return; }
  let lastY = scrollY;
  let lastT = performance.now();
  let vel = 0, sway = 0, swayV = 0, day = -1;
  let running = false;
  const frame = (t) => {
    const dt = Math.max(0.001, Math.min(0.05, (t - lastT) / 1000));
    lastT = t;
    const y = scrollY;
    vel = vel * 0.8 + ((y - lastY) / dt) * 0.2;
    lastY = y;
    const hh = hero ? hero.offsetHeight : 0;
    // Parallax only while the hero is on screen
    if (y < hh + 50) layers.forEach((l) => { l.style.transform = `translate3d(0, ${(Math.min(y, hh) * +l.dataset.depth).toFixed(1)}px, 0)`; });
    // Page progress warms the sky: morning at the top, late afternoon at the foot.
    // Written only when it moves, because it restyles the page.
    const max = document.documentElement.scrollHeight - innerHeight;
    const d = clamp(y / Math.max(1, max), 0, 1);
    if (Math.abs(d - day) > 0.004) { day = d; html.style.setProperty("--day", d.toFixed(3)); }
    // Bunting: a damped spring pushed by scroll speed (idle flutter is CSS)
    const target = clamp(-vel / 160, -14, 14);
    swayV += (target - sway) * 0.08 - swayV * 0.12;
    sway += swayV;
    if (group && y < hh) group.style.setProperty("--sway", sway.toFixed(2));
    // Sleep once everything has settled; the next scroll wakes the loop.
    if (Math.abs(vel) < 2 && Math.abs(sway) < 0.05 && Math.abs(swayV) < 0.05) { running = false; vel = 0; return; }
    requestAnimationFrame(frame);
  };
  const wake = () => { if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(frame); } };
  addEventListener("scroll", wake, { passive: true });
  wake();
}

/* ── Lanterns warm when the pointer comes near ────────────────── */
export function bindLanterns() {
  const lanterns = [...document.querySelectorAll(".lantern")];
  if (!lanterns.length || !finePointer || reduced) return;
  addEventListener("pointermove", (e) => {
    lanterns.forEach((l) => {
      const r = l.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      l.style.setProperty("--glow", clamp(1 - d / 260, 0, 1).toFixed(2));
    });
  }, { passive: true });
}

/* ── Scroll effect 1: the statement lights up word by word ───── */
export function bindStatement() {
  const el = document.querySelector("[data-light]");
  if (!el) return;
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w">${w}</span> `).join("");
  const spans = [...el.querySelectorAll(".w")];
  if (reduced) { spans.forEach((s) => s.classList.add("lit")); return; }
  let lit = -1;
  const update = () => {
    const r = el.getBoundingClientRect();
    const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0, 1);
    const n = Math.round(p * spans.length);
    if (n !== lit) {
      spans.forEach((s, i) => s.classList.toggle("lit", i < n));
      lit = n;
    }
  };
  addEventListener("scroll", update, { passive: true });
  update();
}

/* ── Scroll effect 2: the cloth banner drops off each cover ──── */
export function bindReveals() {
  const els = document.querySelectorAll("[data-reveal]");
  if (reduced || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -18% 0px" });
  els.forEach((e) => io.observe(e));
}

/* ── Cursor: a small ring that picks up lantern light ─────────── */
export function bindCursor() {
  const c = document.querySelector(".cursor");
  if (!c || !finePointer || reduced) return;
  html.classList.add("has-cursor");
  let x = -100, y = -100, cx = -100, cy = -100;
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    const warm = e.target.closest && e.target.closest("a, button, .lantern, input, textarea, label");
    c.classList.toggle("is-warm", !!warm);
  }, { passive: true });
  document.addEventListener("pointerleave", () => c.classList.add("is-away"));
  document.addEventListener("pointerenter", () => c.classList.remove("is-away"));
  let on = false;
  const loop = () => {
    cx += (x - cx) * 0.3;
    cy += (y - cy) * 0.3;
    c.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    if (Math.abs(x - cx) + Math.abs(y - cy) < 0.3) { on = false; return; }
    requestAnimationFrame(loop);
  };
  addEventListener("pointermove", () => { if (!on) { on = true; requestAnimationFrame(loop); } }, { passive: true });
}

/* ── Smooth scroll: Lenis, self-hosted, desktop only ──────────── */
export async function bindSmoothScroll() {
  if (reduced || !finePointer) return null;
  try {
    const { default: Lenis } = await import("./vendor/lenis.js");
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    html.classList.add("lenis");
    return lenis;
  } catch (e) {
    return null;
  }
}
