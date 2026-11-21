/* ============================================================
   motion.js: every moving part of the site.

   Two rules keep it coherent:
   1. Things that enter (reveals, the gateway) use one easing,
      --ease-out, and only animate transform / opacity.
   2. Things you move (cursor, tilt, light, magnetic pull) follow
      the pointer with a short lerp, so they feel weighted.

   Everything checks `reduced` first and falls back to a plain
   fade or a static state.
   ============================================================ */

const html = document.documentElement;
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const EASE_IN = "cubic-bezier(0.7, 0, 0.84, 0)";

/* ── Gateway ──────────────────────────────────────────────────
   Hold: a dark aerial canopy and the title. No counter, bar,
         button or hint. It stays HOLD_MIN ms (long enough to
         read the name) and until the hero photo is ready
         (never longer than 2.4 s).
   Then:
   0.00 s  the title lifts and fades                      (0.6 s)
   0.10 s  the canopy parts along its seam; the halves
           slide out and grow as the camera drops         (1.6 s)
   0.25 s  mist rises through the opening, then thins     (1.6 s)
   0.35 s  the forest below sharpens and settles          (1.8 s)
   0.45 s  sunrise blooms in the gap                      (1.3 s)
   1.55 s  the gate fades, hero copy staggers in          (0.4 s)
   About 3.4 s in total. A key, click, wheel or touch starts
   the move early; nothing on screen asks for it.
   Reduced motion: a short hold, then a plain fade. */
export function runGate({ onDone } = {}) {
  const gate = document.getElementById("gate");
  const finish = () => {
    if (gate) gate.classList.add("is-done");
    html.classList.remove("gate-on");
    document.body.classList.remove("is-locked");
    try { sessionStorage.setItem("jt-gate", "1"); } catch (_) { /* private mode */ }
    onDone && onDone();
  };
  if (!gate || html.classList.contains("no-gate")) { finish(); return; }

  document.body.classList.add("is-locked");
  const left = gate.querySelector(".gate__canopy--l");
  const right = gate.querySelector(".gate__canopy--r");
  const world = gate.querySelector(".gate__world img");
  const mist = gate.querySelector(".gate__mist");
  const bloom = gate.querySelector(".gate__bloom");
  const title = gate.querySelector(".gate__title");

  const HOLD_MIN = reduced ? 600 : 1500;
  let entered = false, autoTimer;
  const heroReady = new Promise((resolve) => {
    const heroImg = document.querySelector(".hero__photo img");
    if (!heroImg || heroImg.complete) return resolve();
    heroImg.addEventListener("load", resolve, { once: true });
    heroImg.addEventListener("error", resolve, { once: true });
    setTimeout(resolve, 2400);
  });
  const held = new Promise((resolve) => { autoTimer = setTimeout(resolve, HOLD_MIN); });
  Promise.all([heroReady, held]).then(() => enter());

  function enter() {
    if (entered) return;
    entered = true;
    clearTimeout(autoTimer);
    removeInputs();

    if (reduced || !gate.animate) {
      const a = gate.animate ? gate.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: "linear", fill: "forwards" }) : null;
      a ? a.finished.then(finish, finish) : finish();
      return;
    }
    const o = { fill: "forwards" };
    const narrow = innerWidth < 700;
    title.animate([
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: "translate3d(0,-18px,0) scale(1.04)" },
    ], { ...o, duration: 600, easing: EASE_IN });
    left.animate([
      { transform: "translate3d(0,0,0) scale(1)" },
      { transform: "translate3d(-3%,0,0) scale(1.04)", offset: 0.22 },
      { transform: `translate3d(${narrow ? -80 : -62}%,0,0) scale(1.7)` },
    ], { ...o, duration: 1600, delay: 100, easing: EASE_IN_OUT });
    right.animate([
      { transform: "translate3d(0,0,0) scale(1)" },
      { transform: "translate3d(3%,0,0) scale(1.04)", offset: 0.22 },
      { transform: `translate3d(${narrow ? 80 : 62}%,0,0) scale(1.7)` },
    ], { ...o, duration: 1600, delay: 100, easing: EASE_IN_OUT });
    mist.animate([
      { opacity: 0, transform: "translate3d(0,12%,0)" },
      { opacity: 1, transform: "translate3d(0,0,0)", offset: 0.4 },
      { opacity: 0, transform: "translate3d(0,-10%,0) scale(1.2)" },
    ], { ...o, duration: 1600, delay: 250, easing: "ease-out" });
    world.animate([
      { transform: "scale(1.25)", filter: "blur(8px) brightness(0.6)" },
      { transform: "scale(1)", filter: "blur(0px) brightness(1)" },
    ], { ...o, duration: 1800, delay: 350, easing: EASE_OUT });
    bloom.animate([{ opacity: 0 }, { opacity: 0.75, offset: 0.5 }, { opacity: 0 }], { ...o, duration: 1300, delay: 450, easing: "ease-in-out" });
    // Release the hero copy just before the gate is gone, so it reads as one move.
    setTimeout(() => html.classList.remove("gate-on"), 1400);
    gate.animate([{ opacity: 1 }, { opacity: 0 }], { ...o, duration: 400, delay: 1550, easing: "linear" })
      .finished.then(finish, finish);
  }

  const onKey = (e) => { if (!["Shift", "Control", "Alt", "Meta"].includes(e.key)) enter(); };
  const onAny = () => enter();
  const inputs = [["keydown", onKey], ["pointerdown", onAny], ["wheel", onAny], ["touchmove", onAny]];
  inputs.forEach(([t, f]) => window.addEventListener(t, f, { passive: true }));
  function removeInputs() { inputs.forEach(([t, f]) => window.removeEventListener(t, f)); }
}

/* ── Reveals + section frames ─────────────────────────────── */
export function bindReveals(root = document) {
  // Each [data-frame] section gets a hairline that is drawn in once.
  root.querySelectorAll("[data-frame]").forEach((sec) => {
    if (sec.querySelector(":scope > .frame")) return;
    const f = document.createElement("div");
    f.className = "frame";
    f.setAttribute("aria-hidden", "true");
    f.innerHTML = '<svg><rect class="frame__base" width="100%" height="100%" rx="12" pathLength="1"/><rect width="100%" height="100%" rx="12" pathLength="1"/></svg>';
    sec.prepend(f);
  });

  const targets = root.querySelectorAll(".rv, .rv-mask, .wipe, .frame");
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("is-in"));
    return;
  }
  // A .wipe starts fully clipped, and Chromium's observer honours the target's own
  // clip-path, so it would never intersect. Watch its unclipped parent instead.
  const owners = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      (owners.get(en.target) || []).forEach((t) => t.classList.add("is-in"));
      io.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
  targets.forEach((t) => {
    const watch = t.classList.contains("wipe") ? t.parentElement : t;
    if (!owners.has(watch)) { owners.set(watch, []); io.observe(watch); }
    owners.get(watch).push(t);
  });
}

/** Wrap each line of a .rv-mask heading so it can slide out of its mask. */
export function splitLines(root = document) {
  root.querySelectorAll(".rv-mask[data-lines]").forEach((el) => {
    el.querySelectorAll(":scope > .ln").forEach((ln, i) => {
      ln.style.setProperty("--i", i);
      ln.innerHTML = `<span>${ln.innerHTML}</span>`;
    });
  });
}

/* ── Statement: the muted half "ripens" word by word ─────── */
function prepareStatement() {
  const el = document.querySelector(".statement__text");
  const tail = el && el.querySelector(".st-b");
  if (!tail) return null;
  if (reduced) return null; // keep full contrast
  const words = tail.textContent.trim().split(/\s+/);
  tail.innerHTML = words.map((w) => `<span class="w is-muted">${w}</span>`).join(" ");
  return { el, words: [...tail.querySelectorAll(".w")] };
}

/* ── Scroll loop: dawn, parallax, dolly, statement ───────── */
export function bindScroll() {
  const hero = document.querySelector(".hero__photo img");
  const aerial = document.querySelector(".aerial__photo img");
  const layers = [...document.querySelectorAll(".scene__layer")];
  const dollies = [...document.querySelectorAll("[data-dolly]")];
  const statement = prepareStatement();
  let lastLit = -1, queued = false;

  const update = () => {
    queued = false;
    const y = window.scrollY, vh = innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const dawn = clamp(y / max);
    html.style.setProperty("--dawn", dawn.toFixed(3));
    html.style.setProperty("--scroll", y.toFixed(0));

    if (!reduced) {
      if (hero && y < vh * 1.2) hero.style.transform = `translate3d(0, ${(y * 0.22).toFixed(1)}px, 0)`;
      if (aerial) {
        const r = aerial.parentElement.parentElement.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) {
          // Seen from above: the ground drifts slower than the page and the camera sinks a little.
          const p = clamp((vh - r.top) / (vh + r.height));
          aerial.style.transform = `translate3d(0, ${((p - 0.5) * -60).toFixed(1)}px, 0) scale(${(1.12 - p * 0.08).toFixed(4)})`;
        }
      }
      layers.forEach((l, i) => { l.style.transform = `translate3d(0, ${(-dawn * (3 + i * 3)).toFixed(2)}%, 0) scale(1.04)`; });
      dollies.forEach((d) => {
        const r = d.getBoundingClientRect();
        if (r.top > vh || r.bottom < 0) return;
        const p = clamp((vh - r.top) / (vh * 0.7));
        d.style.transform = `translate3d(0, ${((1 - p) * 36).toFixed(1)}px, 0) scale(${(0.97 + p * 0.03).toFixed(4)})`;
      });
    }

    if (statement) {
      const r = statement.el.getBoundingClientRect();
      const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.25));
      const lit = Math.round(p * statement.words.length);
      if (lit !== lastLit) {
        statement.words.forEach((w, i) => w.classList.toggle("is-muted", i >= lit));
        lastLit = lit;
      }
    }
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  addEventListener("layoutchange", onScroll);
  update();
}

/* ── Light traces: a faint node-link network in the air ─────
   Canvas 2D, capped at 30 fps, at most 1.5 device pixels,
   fewer nodes on small screens, paused in hidden tabs.
   Reduced motion draws a single still frame. */
export function bindTraces() {
  const canvas = document.querySelector(".scene__traces");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(1.5, devicePixelRatio || 1);
  const cores = navigator.hardwareConcurrency || 4;
  let w = 0, h = 0, nodes = [], px = -999, py = -999, last = 0, raf = 0;

  const seed = () => {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = w < 700 || cores <= 4 ? 18 : 34;
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.08,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const link = Math.min(220, w * 0.18);
    // Contour lines: two slow sine bands, like isolines on a survey map.
    ctx.lineWidth = 1;
    const t = performance.now() / 9000;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 24) {
        const y = h * (0.62 + k * 0.14) + Math.sin(x / 260 + t + k) * 18 + Math.sin(x / 90 + t * 2) * 4;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = "rgba(220,171,95,0.07)";
      ctx.stroke();
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > link) continue;
        const near = Math.hypot((a.x + b.x) / 2 - px, (a.y + b.y) / 2 - py) < 160 ? 2.2 : 1;
        ctx.strokeStyle = `rgba(236,229,216,${((1 - d / link) * 0.08 * near).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.fillStyle = "rgba(236,202,143,0.35)";
      ctx.fillRect(a.x - 1, a.y - 1, 2, 2);
    }
  };

  const step = (now) => {
    raf = requestAnimationFrame(step);
    if (now - last < 33) return;
    last = now;
    nodes.forEach((n) => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
    });
    draw();
  };

  seed();
  if (reduced) { draw(); addEventListener("resize", () => { seed(); draw(); }); return; }
  if (finePointer) addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; }, { passive: true });
  addEventListener("resize", seed);
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(step);
  });
  raf = requestAnimationFrame(step);
}

/* ── Pointer: lit borders, cover tilt, magnetic buttons ──── */
export function bindPointer() {
  if (!finePointer || reduced) return;

  document.addEventListener("pointermove", (e) => {
    const lit = e.target.closest && e.target.closest(".lit");
    if (lit) {
      const r = lit.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      lit.style.setProperty("--mx", `${x.toFixed(0)}px`);
      lit.style.setProperty("--my", `${y.toFixed(0)}px`);
      const ang = (Math.atan2(y - r.height / 2, x - r.width / 2) * 180) / Math.PI + 70;
      lit.style.setProperty("--angle", `${ang.toFixed(0)}deg`);
    }
    const cover = e.target.closest && e.target.closest(".cover");
    if (cover) {
      const r = cover.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      const frame = cover.querySelector(".cover__frame");
      frame.style.setProperty("--ry", `${(nx * 7).toFixed(2)}deg`);
      frame.style.setProperty("--rx", `${(-ny * 6).toFixed(2)}deg`);
    }
  }, { passive: true });

  document.querySelectorAll(".cover").forEach((c) => c.addEventListener("pointerleave", () => {
    const f = c.querySelector(".cover__frame");
    f.style.setProperty("--rx", "0deg"); f.style.setProperty("--ry", "0deg");
  }));

  document.querySelectorAll("[data-magnetic]").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.style.transform = `translate3d(${clamp(dx * 0.22, -8, 8).toFixed(1)}px, ${clamp(dy * 0.3, -6, 6).toFixed(1)}px, 0)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });
}

/* ── Cursor: a small dot and a soft light that trails it ── */
export function bindCursor() {
  const el = document.querySelector(".cursor");
  if (!el || !finePointer || reduced) { el && el.remove(); return; }
  const glow = el.querySelector(".cursor__glow");
  let x = -100, y = -100, gx = -100, gy = -100, on = false;

  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    if (!on) { on = true; gx = x; gy = y; html.classList.add("cursor-on"); }
    const hot = e.target.closest && e.target.closest("a, button, [data-hot], label, .cover");
    html.classList.toggle("cursor-hot", !!hot);
  }, { passive: true });
  document.addEventListener("pointerleave", () => html.classList.add("cursor-hide"));
  document.addEventListener("pointerenter", () => html.classList.remove("cursor-hide"));

  const loop = () => {
    gx += (x - gx) * 0.14; gy += (y - gy) * 0.14;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    glow.style.translate = `${(gx - x).toFixed(1)}px ${(gy - y).toFixed(1)}px`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ── Smooth scroll: Lenis, loaded only when it is useful ───
   Skipped on touch devices (native scroll is better there)
   and under reduced motion. If the CDN is unreachable the
   page simply keeps native scrolling. */
export async function bindSmoothScroll() {
  if (reduced || !finePointer) return null;
  try {
    const { default: Lenis } = await import("https://cdn.jsdelivr.net/npm/lenis@1.1.20/+esm");
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 0.95 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    html.classList.add("lenis");
    return lenis;
  } catch (_) {
    return null;
  }
}
