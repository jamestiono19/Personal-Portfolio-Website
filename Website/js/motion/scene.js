// @ts-check
/* ════════════════════════════════════════════════════════════════
   scene.js — drives the fixed sunrise scene from scroll position.

   Writes a single custom property, --p (0 at the top, 1 at the
   bottom), on .scene. css/scene.css derives every layer's opacity
   and transform from it: the sky cross-fades dawn → sunrise →
   morning, the sun climbs, treelines and mist parallax at their own
   depths. One style write per frame, transform/opacity only.
   ════════════════════════════════════════════════════════════════ */

import { $, clamp } from "./utils.js";

export function initScene() {
  const scene = $("#scene");
  if (!scene) return;
  let queued = false;
  let lastP = -1;

  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = clamp(max > 0 ? window.scrollY / max : 0);
    if (Math.abs(p - lastP) < 0.0005) return;
    lastP = p;
    scene.style.setProperty("--p", p.toFixed(4));
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("layout-change", queue);
  update();
}
