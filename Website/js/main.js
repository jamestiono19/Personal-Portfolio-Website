// @ts-check
/* ════════════════════════════════════════════════════════════════
   main.js — entry point (an ES module, so it runs after parsing).

   Order:
     1. render everything driven by js/data/projects.js
     2. wire the interface (nav, filters, contact form, to-top)
     3. start the scene and ambient details
     4. load the animation libraries in the background (code-split:
        nothing blocks first paint; skipped entirely under reduced
        motion), play the gateway, then hand over to smooth scroll
        and the scroll-linked camera
   ════════════════════════════════════════════════════════════════ */

import { renderProjects } from "./render.js";
import { initUI } from "./ui.js";
import { initScene } from "./motion/scene.js";
import { initIntro } from "./motion/intro.js";
import { initScroll } from "./motion/scroll.js";
import { initVines } from "./motion/vines.js";
import { initAmbient } from "./motion/ambient.js";
import { calm, loadScript } from "./motion/utils.js";

const w = /** @type {any} */ (window);

renderProjects();
initUI();
initScene();
initAmbient();

/* Animation libraries wait for the page's own load event (and an idle
   moment), so they never compete with the first paint. */
const afterLoad = new Promise((resolve) => {
  const go = () => ("requestIdleCallback" in w ? w.requestIdleCallback(resolve, { timeout: 600 }) : setTimeout(resolve, 50));
  if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
});

/** @type {Promise<any>} */
const gsapReady = calm()
  ? Promise.reject(new Error("reduced motion"))
  : afterLoad.then(() => loadScript("./vendor/gsap.min.js")).then(() => w.gsap);
gsapReady.catch(() => { /* handled by callers */ });

const libsReady = calm()
  ? Promise.resolve(null)
  : Promise.all([
      gsapReady,
      gsapReady.then(() => loadScript("./vendor/ScrollTrigger.min.js")),
      afterLoad.then(() => loadScript("./vendor/lenis.min.js")),
    ]).then(() => ({ gsap: w.gsap, ScrollTrigger: w.ScrollTrigger, Lenis: w.Lenis }))
      .catch(() => null);

initIntro(gsapReady).then(async () => {
  initVines();
  initScroll(await libsReady);
  window.dispatchEvent(new Event("layout-change"));
});
