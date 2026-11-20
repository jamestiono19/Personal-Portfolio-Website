// @ts-check
/* ════════════════════════════════════════════════════════════════
   ambient.js — small living details. All decorative, all optional.
     dewNetwork   faint node-and-edge "dew drops" drifting in the sky
                  (the data network behind the scenery)
     orb          soft light-orb cursor + "sunbeam" on glass cards
     pollen       pollen, fireflies and petals drifting near the cursor
                  over cards (capped, canvas, idles when empty)
   Desktop pointer only for orb/pollen; static under reduced motion.
   ════════════════════════════════════════════════════════════════ */

import { $, calm, finePointer, lerp } from "./utils.js";

/* ── Dew-drop network ─────────────────────────────────────── */
function dewNetwork() {
  const canvas = /** @type {HTMLCanvasElement|null} */ ($("#dew"));
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  let W = 0, H = 0;
  /** @type {{x:number,y:number,vx:number,vy:number,r:number}[]} */
  let nodes = [];

  const resize = () => {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = W < 640 ? 18 : W < 1100 ? 30 : 42;
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.62,           // keep to the sky, above the treeline
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.08,
      r: 1 + Math.random() * 1.8,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const link = W < 640 ? 110 : 150;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) {
          ctx.strokeStyle = `rgba(214, 236, 200, ${(1 - d / link) * 0.16})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      // A dew drop: soft body + a bright highlight.
      ctx.fillStyle = "rgba(220, 240, 214, 0.32)";
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255, 250, 232, 0.85)";
      ctx.beginPath(); ctx.arc(n.x - n.r * 0.3, n.y - n.r * 0.3, n.r * 0.45, 0, Math.PI * 2); ctx.fill();
    }
  };

  const step = () => {
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
      if (n.y < -20 || n.y > H * 0.7) n.vy *= -1;
    }
  };

  resize();
  draw();
  window.addEventListener("resize", () => { resize(); draw(); });
  if (calm()) return;

  // ~30 fps is plenty for something this slow; pause when hidden.
  let last = 0;
  const loop = (t) => {
    if (!document.hidden && t - last > 33) { last = t; step(); draw(); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ── Orb cursor, sunbeam and pollen ───────────────────────── */
function orbAndPollen() {
  if (!finePointer() || calm()) return;
  const html = document.documentElement;
  const orb = $(".orb");
  const canvas = /** @type {HTMLCanvasElement|null} */ ($("#pollen"));
  const ctx = canvas?.getContext("2d");
  if (!orb || !canvas || !ctx) return;
  html.classList.add("has-orb", "has-pollen");

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = () => {
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  window.addEventListener("resize", size);

  let mx = -100, my = -100, hx = -100, hy = -100, hs = 1, targetS = 1;
  let overCard = false;
  let lastSpawn = 0;
  /** @type {{x:number,y:number,vx:number,vy:number,life:number,max:number,kind:number,size:number,rot:number}[]} */
  const parts = [];
  const MAX = 64;
  let running = false;

  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mx = e.clientX; my = e.clientY;
    orb.classList.remove("is-hidden");
    const t = /** @type {HTMLElement} */ (e.target);
    targetS = t.closest?.("a, button, input, textarea, .filter") ? 1.8 : 1;

    // Sunbeam: light the glass card under the pointer.
    const card = /** @type {HTMLElement|null} */ (t.closest?.(".beam"));
    if (card) {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${mx - r.left}px`);
      card.style.setProperty("--my", `${my - r.top}px`);
    }
    overCard = Boolean(t.closest?.("[data-vine], .beam"));
    const now = performance.now();
    if (overCard && now - lastSpawn > 45 && parts.length < MAX) {
      lastSpawn = now;
      const kind = Math.random();
      parts.push({
        x: mx + (Math.random() - 0.5) * 24, y: my + (Math.random() - 0.5) * 24,
        vx: (Math.random() - 0.5) * 0.5, vy: -0.25 - Math.random() * 0.5,
        life: 0, max: 70 + Math.random() * 70,
        kind: kind < 0.6 ? 0 : kind < 0.88 ? 1 : 2,       // pollen · firefly · petal
        size: 1 + Math.random() * 2.2, rot: Math.random() * 6.28,
      });
      if (!running) { running = true; requestAnimationFrame(loop); }
    }
  }, { passive: true });
  document.addEventListener("pointerleave", () => orb.classList.add("is-hidden"));

  const loop = () => {
    // Orb: crisp core, lagging halo.
    hx = lerp(hx, mx, 0.2); hy = lerp(hy, my, 0.2); hs = lerp(hs, targetS, 0.15);
    orb.style.setProperty("--cx", `${mx}px`); orb.style.setProperty("--cy", `${my}px`);
    orb.style.setProperty("--hx", `${hx}px`); orb.style.setProperty("--hy", `${hy}px`);
    orb.style.setProperty("--hs", hs.toFixed(3));

    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++;
      p.x += p.vx + Math.sin((p.life + p.rot * 10) / 14) * 0.25;
      p.y += p.vy;
      p.rot += 0.03;
      const k = p.life / p.max;
      const a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
      if (p.kind === 0) {                               // pollen
        ctx.fillStyle = `rgba(255, 214, 140, ${a * 0.85})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 1) {                        // firefly (blinks)
        const blink = 0.5 + 0.5 * Math.sin(p.life / 5);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 7);
        g.addColorStop(0, `rgba(214, 255, 160, ${a * blink})`);
        g.addColorStop(1, "rgba(214, 255, 160, 0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
      } else {                                          // petal
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(246, 201, 168, ${a * 0.9})`;
        ctx.beginPath(); ctx.ellipse(0, 0, p.size * 2.2, p.size * 1.1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      if (p.life >= p.max) parts.splice(i, 1);
    }
    // Keep running while the orb is still easing or particles live.
    const settling = Math.abs(hx - mx) + Math.abs(hy - my) + Math.abs(hs - targetS) > 0.5;
    if (parts.length || settling) requestAnimationFrame(loop);
    else running = false;
  };
  document.addEventListener("pointermove", () => { if (!running) { running = true; requestAnimationFrame(loop); } }, { passive: true });
}

export function initAmbient() {
  dewNetwork();
  orbAndPollen();
}
