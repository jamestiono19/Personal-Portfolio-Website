// @ts-check
/* ════════════════════════════════════════════════════════════════
   intro.js — the gateway: "walking through a door into an open world".

   Timeline (≈3.5–4 s end to end, skippable at any point):
     0.0 s   dark forest-green page, JT monogram, 00 → 100 counter
             (holds at 90 until the page has loaded)
     enter   on Enter / click / scroll / Enter key (or auto after a
             short pause at 100):
     +0.15   the page rolls up like paper, its roll thickening
     +0.75   the camera dollies through the arched doorway: the door
             scales past the viewport edges, cross-fading to a
             pre-blurred copy (motion blur with opacity only)
     +0.70   the sunrise scene behind scales 0.86 → 1
     +1.35   light bloom as the sun floods in
     +1.80   hero text staggers in (CSS transitions)

   transform/opacity only. Reduced motion → a plain fade. Shown once
   per session. The gateway is aria-hidden; the visible "Skip intro"
   button sits outside it, and any keyboard focus elsewhere ends the
   intro at once, so it never traps keyboard or screen-reader users.
   ════════════════════════════════════════════════════════════════ */

import { $, calm, timeout } from "./utils.js";

/**
 * @param {Promise<any>} gsapReady resolves with window.gsap (or rejects)
 * @returns {Promise<void>} resolves when the intro has fully finished
 */
export function initIntro(gsapReady) {
  const html = document.documentElement;
  if (!html.classList.contains("gate-on")) return Promise.resolve();

  const gateway = $("#gateway");
  const skipBtn = $("#skip-intro");
  if (!gateway) { html.classList.remove("intro-on", "gate-on"); return Promise.resolve(); }

  const sheet = $(".gateway__sheet", gateway);
  const roll = $(".gateway__roll", gateway);
  const inner = $(".gateway__inner", gateway);
  const doors = gateway.querySelectorAll(".gateway__door");
  const door = doors[0];
  const doorBlur = doors[1];
  const bloom = $(".gateway__bloom", gateway);
  const num = $("#gateway-num");
  const bar = $("#gateway-bar");
  const scene = $("#scene");
  const hero = $("#hero-frame");

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  return new Promise((resolve) => {
    let started = false;
    let done = false;
    let ready = false;
    let tl = null;
    let autoTimer = 0;
    let loaded = document.readyState === "complete";
    const t0 = performance.now();
    const MIN = calm() ? 400 : 1400;

    if (!loaded) {
      window.addEventListener("load", () => { loaded = true; }, { once: true });
      setTimeout(() => { loaded = true; }, 3500); // never wait forever
    }

    /* ── 00 → 100 counter ─────────────────────────────────── */
    let shown = 0;
    const tick = () => {
      if (done) return;
      const linear = Math.min(1, (performance.now() - t0) / MIN);
      const target = started ? 1 : loaded ? linear : Math.min(linear, 0.9);
      shown += (target - shown) * (started ? 0.35 : 0.18);
      if (target === 1 && 1 - shown < 0.004) shown = 1;
      const v = Math.round(shown * 100);
      if (num) num.textContent = String(v).padStart(2, "0");
      if (bar) bar.style.transform = `scaleX(${shown})`;
      if (v >= 100 && !ready) {
        ready = true;
        gateway.classList.add("is-ready");
        autoTimer = window.setTimeout(enter, 1800);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    /* ── Triggers ─────────────────────────────────────────── */
    const onWheel = (e) => { e.preventDefault(); enter(); };
    const onKey = (e) => {
      if (e.key === "Escape") { skip(); return; }
      if (document.activeElement === skipBtn) return; // its own click handles it
      if (["Enter", " ", "ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); enter(); }
    };
    // Focus on real content ends the intro; the two skip controls don't.
    const onFocus = (e) => {
      const t = /** @type {HTMLElement} */ (e.target);
      if (t === skipBtn || gateway.contains(t) || t.classList?.contains("skip-link")) return;
      skip();
    };
    gateway.addEventListener("click", enter);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    skipBtn?.addEventListener("click", skip);

    const unbind = () => {
      gateway.removeEventListener("click", enter);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onWheel);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      skipBtn?.removeEventListener("click", skip);
    };

    /* ── Play ─────────────────────────────────────────────── */
    async function enter() {
      if (started || done) return;
      started = true;
      clearTimeout(autoTimer);
      const gsap = calm() ? null : await timeout(gsapReady.catch(() => null), 1200);
      if (done) return;
      if (!gsap) { fade(); return; }

      gsap.set(scene, { scale: 0.86, transformOrigin: "50% 62%" });
      gsap.set(hero, { scale: 0.9, opacity: 0, transformOrigin: "50% 60%" });

      tl = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: finish });
      tl.to(inner, { yPercent: -16, opacity: 0, duration: 0.7, ease: "power2.in" }, 0)
        .to(sheet, { yPercent: -104, duration: 1.2 }, 0.15)
        .to(roll, { scaleY: 1.7, duration: 1.2 }, 0.15)
        .to(scene, { scale: 1, duration: 2.1, ease: "power2.out" }, 0.7)
        .to(hero, { scale: 1, opacity: 1, duration: 1.8, ease: "power2.out" }, 0.9)
        .to([door, doorBlur], { scale: 6.5, duration: 1.7, ease: "power3.in" }, 0.75)
        .to(doorBlur, { opacity: 1, duration: 0.45, ease: "none" }, 1.4)
        .to(door, { opacity: 0, duration: 0.45, ease: "none" }, 1.55)
        .to(doorBlur, { opacity: 0, duration: 0.5, ease: "none" }, 2.0)
        .to(bloom, { opacity: 0.85, duration: 0.55, ease: "sine.in" }, 1.35)
        .to(bloom, { opacity: 0, duration: 1.0, ease: "sine.out" }, 1.95)
        .add(() => html.classList.remove("intro-on"), 1.8);
    }

    /* Reduced motion (or no GSAP): a simple fade. */
    function fade() {
      html.classList.remove("intro-on");
      gateway.style.transition = "opacity 500ms ease";
      gateway.style.opacity = "0";
      setTimeout(finish, 520);
    }

    function skip() {
      if (done) return;
      started = true;
      tl?.kill();
      finish();
    }

    function finish() {
      if (done) return;
      done = true;
      clearTimeout(autoTimer);
      unbind();
      const hadFocus = document.activeElement === skipBtn;
      html.classList.remove("intro-on", "gate-on");
      gateway.hidden = true;
      [scene, hero].forEach((el) => { if (el) { el.style.transform = ""; el.style.opacity = ""; } });
      try { sessionStorage.setItem("jt-gateway", "1"); } catch (e) { /* private mode */ }
      if (hadFocus) $("#hero-title")?.focus({ preventScroll: true });
      resolve();
    }
  });
}
