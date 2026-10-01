/* ============================================================
   NERVOUS.JS — Interaction layer for "Editorial Index"

   Small, self-contained modules. Each one is started on its
   own inside a guard, so a failure in one cannot take the rest
   of the page down with it.

     intro        the door into the portfolio
     theme        paper (default) / ink, remembered
     typewriter   the rotating word in the hero
     reveals      staggered scroll reveals
     gallery      discipline filters and alternating rhythm
     figures      key-figure count-up and frame annotations
     tilt         a slight lean on the portrait
     magnetic     CTAs that drift toward the pointer
     cursor       trailing ring for fine pointers
     scrollState  masthead, progress, active section, parallax
     navigation   smooth anchors and the fullscreen menu
     contactForm  validated mailto hand-off
   ============================================================ */

(() => {
  "use strict";

  /* ── Shared helpers ────────────────────────────────────── */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const calm = () => reduceMotion.matches;

  /* Opens the page (starts the hero entrance). Idempotent. */
  const openPage = () => document.body.classList.add("is-open");

  /* ── intro · THE DOOR ──────────────────────────────────────
     01 Arrival · 02 Identity · 03 Threshold · 04 Opening · 05 Enter
     ~3.3 s in full, ~1.2 s for returning visitors, weak devices
     or deep links, skipped under reduced motion. Any click, key,
     wheel or swipe opens the door at once. The swing is
     advanced in discrete ~15 fps frames with a little jitter,
     so it reads as crafted rather than tweened. */
  function intro() {
    const door = $("#intro");
    const html = document.documentElement;
    if (!door) { openPage(); return; }
    if (calm()) { door.remove(); openPage(); return; }

    let seen = false;
    try { seen = sessionStorage.getItem("jt-door") === "1"; } catch (e) { /* ignore */ }
    const conn = navigator.connection;
    const weak = (navigator.hardwareConcurrency || 4) <= 2 || Boolean(conn && conn.saveData);
    const short = seen || weak || location.hash.length > 1;

    html.classList.add("intro-on");
    html.style.setProperty("--open", "0");
    document.body.classList.add("is-locked");

    // Split each half of the name into individually timed letters
    const letters = [];
    $$("[data-split]", door).forEach((el) => {
      const text = el.textContent;
      el.textContent = "";
      [...text].forEach((chr) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = chr;
        const r = (m) => ((Math.random() * 2 - 1) * m).toFixed(3);
        s.style.setProperty("--jx", `${r(0.06)}em`);
        s.style.setProperty("--jy", `${r(0.09)}em`);
        s.style.setProperty("--jr", `${r(3.5)}deg`);
        el.appendChild(s);
        letters.push(s);
      });
    });

    const frameNum = $(".intro__frame b", door);
    const frameName = $(".intro__framename", door);
    const countNum = $(".intro__num", door);
    const setFrame = (n, name) => {
      if (frameNum) frameNum.textContent = String(n).padStart(2, "0");
      if (frameName) frameName.textContent = name;
    };

    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    let phase = "playing";

    // The counter ticks in whole frames, not a smooth roll
    const countTo = (from, to, ms) => {
      const steps = Math.max(1, Math.round(ms / 90));
      for (let k = 1; k <= steps; k += 1) {
        at((ms / steps) * k, () => {
          if (countNum) countNum.textContent = String(Math.round(from + (to - from) * (k / steps))).padStart(2, "0");
        });
      }
    };

    const finish = () => {
      if (phase === "done") return;
      phase = "done";
      setFrame(5, "Enter");
      const hadFocus = door.contains(document.activeElement);
      door.classList.add("is-gone");
      html.classList.remove("intro-on");
      html.style.removeProperty("--open");
      document.body.classList.remove("is-locked");
      try { sessionStorage.setItem("jt-door", "1"); } catch (e) { /* ignore */ }
      if (hadFocus) {
        const brand = $(".masthead__brand");
        if (brand) brand.focus({ preventScroll: true });
      }
      setTimeout(() => door.remove(), 450);
    };

    const open = (duration) => {
      if (phase !== "playing") return;
      phase = "opening";
      timers.forEach(clearTimeout);
      letters.forEach((l) => l.classList.add("is-on"));
      door.classList.add("f1", "f2b", "f3", "f4");
      if (countNum) countNum.textContent = "100";
      setFrame(4, "Opening");
      openPage();

      const FPS = 15;
      const start = performance.now();
      let last = -1;
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

      const step = (now) => {
        const t = clamp((now - start) / duration, 0, 1);
        const frame = Math.floor(((now - start) / 1000) * FPS);
        if (frame !== last || t === 1) {
          last = frame;
          const q = t === 1 ? 1 : Math.min(1, (frame + 1) / (duration / 1000 * FPS));
          const p = ease(q);
          const wobble = (1 - p) * 0.6;
          html.style.setProperty("--open", p.toFixed(4));
          door.style.setProperty("--jl", `${((Math.random() * 2 - 1) * wobble).toFixed(2)}deg`);
          door.style.setProperty("--jr", `${((Math.random() * 2 - 1) * wobble).toFixed(2)}deg`);
        }
        if (t < 1) requestAnimationFrame(step);
        else finish();
      };
      requestAnimationFrame(step);
    };

    // Skip / enter — the visitor is never held at the door
    const enterNow = () => open(650);
    door.addEventListener("click", enterNow);
    window.addEventListener("keydown", (e) => {
      if (phase !== "playing") return;
      if (["Enter", " ", "Escape", "ArrowDown", "PageDown", "End"].includes(e.key)) {
        e.preventDefault();
        enterNow();
      }
    });
    window.addEventListener("wheel", () => { if (phase === "playing") enterNow(); }, { passive: true });
    window.addEventListener("touchmove", () => { if (phase === "playing") enterNow(); }, { passive: true });

    if (short) {
      letters.forEach((l) => l.classList.add("is-on"));
      door.classList.add("f1", "f2b");
      setFrame(3, "Threshold");
      at(60, () => door.classList.add("f3"));
      countTo(0, 100, 320);
      at(380, () => open(820));
    } else {
      // 01 Arrival
      at(40, () => door.classList.add("f1"));
      countTo(0, 100, 2000);
      // 02 Identity — one letter per frame, timing slightly uneven
      at(380, () => setFrame(2, "Identity"));
      let t = 420;
      letters.forEach((l) => {
        at(t, () => l.classList.add("is-on"));
        t += 58 + Math.round(Math.random() * 34);
      });
      at(t + 60, () => door.classList.add("f2b"));
      // 03 Threshold — seam and handles appear, letters settle
      at(1560, () => { setFrame(3, "Threshold"); door.classList.add("f3"); });
      // 04 Opening → 05 Enter
      at(2180, () => open(1150));
    }

    // Hard safety net: the page always opens
    setTimeout(() => { if (phase !== "done") { open(400); setTimeout(finish, 600); } }, 6500);
  }

  /* Emergency exit used if the intro module itself throws */
  function forceOpen() {
    const door = $("#intro");
    if (door) door.remove();
    document.documentElement.classList.remove("intro-on");
    document.documentElement.style.removeProperty("--open");
    document.body.classList.remove("is-locked");
    openPage();
  }

  /* ── theme · paper (default) or ink ──────────────────────── */
  function theme() {
    const toggle = $("#theme-toggle");
    const root = document.documentElement;
    const metaTheme = $('meta[name="theme-color"]');

    const icons = {
      sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2M12 20.5v2M3.6 3.6l1.4 1.4M19 19l1.4 1.4M1.5 12h2M20.5 12h2M3.6 20.4 5 19M19 5l1.4-1.4"/></svg>',
      moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z"/></svg>'
    };

    const apply = (mode) => {
      const dark = mode === "dark";
      if (dark) root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
      if (toggle) {
        toggle.innerHTML = dark ? icons.sun : icons.moon;
        toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      }
      if (metaTheme) metaTheme.setAttribute("content", dark ? "#0d0c0b" : "#f3efea");
    };

    let stored = null;
    try { stored = localStorage.getItem("portfolio-theme"); } catch (e) { /* private mode */ }
    apply(stored === "dark" ? "dark" : "light");

    if (toggle) {
      toggle.addEventListener("click", () => {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        try { localStorage.setItem("portfolio-theme", next); } catch (e) { /* ignore */ }
        apply(next);
      });
    }
  }

  /* ── typewriter ────────────────────────────────────────── */
  function typewriter() {
    const typer = $("#typewriter-text");
    if (!typer) return;
    const words = ["data-driven", "interactive", "innovative", "impactful"];
    if (calm()) { typer.textContent = words[0]; return; }

    let w = 0, c = 0, deleting = false;
    const tick = () => {
      const word = words[w];
      c += deleting ? -1 : 1;
      typer.textContent = word.slice(0, c);
      let delay = deleting ? 45 : 95;

      if (!deleting && c === word.length) {
        deleting = true;
        delay = 1900;
      } else if (deleting && c === 0) {
        deleting = false;
        w = (w + 1) % words.length;
        delay = 380;
      }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 1400);
  }

  /* ── reveals · staggered scroll reveals ────────────────────
     Each headline's lines get sequential indices so they
     cascade rather than arriving all at once. */
  function reveals() {
    $$(".ln").forEach((line) => {
      const parent = line.parentElement;
      if (!parent || line.style.getPropertyValue("--i")) return;
      const siblings = $$(":scope > .ln", parent);
      if (siblings.length > 1) line.style.setProperty("--i", String(siblings.indexOf(line)));
    });

    const targets = $$(".reveal, .statement, .contact__title .ln");
    if (calm() || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }
    /* threshold must stay near zero: a ratio like 0.15 never
       resolves for elements taller than the viewport (a project
       card can exceed 100vh), leaving them permanently hidden.
       The negative bottom margin is what delays the trigger. */
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -10% 0px" });
    targets.forEach((el) => io.observe(el));
  }

  /* ── gallery · filters and alternating rhythm ─────────────── */
  function gallery() {
    const filters = $$(".filter");
    const works = $$(".work");
    const emptyNote = $(".gallery__empty");
    const status = $(".filters__status");

    // Keeps the left/right alternation correct after filtering
    const restripe = () => {
      let n = 0;
      works.forEach((work) => {
        if (work.classList.contains("is-hidden") || work.classList.contains("work--lead")) return;
        work.classList.toggle("is-flip", n % 2 === 1);
        n += 1;
      });
    };

    const describe = (count, label) => {
      if (count === 0) return "No projects in this discipline";
      const noun = count === 1 ? "project" : "projects";
      return label === "all" ? `Showing all ${count} ${noun}` : `Showing ${count} ${noun}`;
    };

    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-pressed", String(b === btn));
        });

        const want = btn.dataset.filter;
        let shown = 0;
        works.forEach((work) => {
          const match = want === "all" || work.dataset.category === want;
          if (match) shown += 1;
          work.classList.toggle("is-hidden", !match);
          if (match) {
            // Re-run the entrance so filtered results feel deliberate
            work.classList.remove("is-in");
            requestAnimationFrame(() => requestAnimationFrame(() => work.classList.add("is-in")));
          }
        });

        if (emptyNote) emptyNote.hidden = shown !== 0;
        if (status) status.textContent = describe(shown, want);
        restripe();
      });
    });

    restripe();
  }

  /* ── figures · key-figure count-up and frame annotation ─────
     Numbers count up once when their block scrolls into view.
     Screen readers get the final value straight away from a
     visually hidden copy; the animated digits are hidden from
     them. Hovering a figure pins its label onto the frame. */
  function figures() {
    const unitText = (num) => {
      const unit = num.parentElement && $(".spec__unit", num.parentElement);
      if (!unit) return "";
      const u = unit.textContent.trim();
      return u.length > 1 ? ` ${u}` : u;
    };

    // Frame annotation
    $$(".work").forEach((work) => {
      const media = $(".work__media", work);
      const cells = $$(".spec__cell", work);
      if (!media || !cells.length) return;

      const probe = document.createElement("span");
      probe.className = "work__probe mono";
      probe.setAttribute("aria-hidden", "true");
      const probeLabel = document.createElement("b");
      const probeValue = document.createElement("span");
      probe.append(probeLabel, probeValue);
      media.appendChild(probe);

      cells.forEach((cell) => {
        cell.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "touch") return;
          const label = $(".spec__label", cell);
          const num = $(".spec__num", cell);
          const figure = $(".spec__figure", cell);
          probeLabel.textContent = label ? label.textContent : "";
          probeValue.textContent = num ? `${num.dataset.final || num.textContent}${unitText(num)}` : (figure ? figure.textContent.trim() : "");
          work.classList.add("is-probing");
        });
        cell.addEventListener("pointerleave", () => work.classList.remove("is-probing"));
      });
    });

    // Count-up
    const nums = $$(".spec__num[data-count]");
    if (!nums.length || calm() || !("IntersectionObserver" in window)) return;

    nums.forEach((num) => {
      const final = num.textContent.trim();
      if (!/^\d+(\.\d+)?$/.test(final)) return;
      num.dataset.final = final;
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = final;
      num.after(sr);
      num.setAttribute("aria-hidden", "true");
      num.textContent = (0).toFixed((final.split(".")[1] || "").length);
    });

    const settle = (num) => { if (num.dataset.final) num.textContent = num.dataset.final; };
    const run = (num, delay) => {
      const target = parseFloat(num.dataset.final);
      const decimals = (num.dataset.final.split(".")[1] || "").length;
      const duration = 1200;
      const easeOut = (t) => 1 - Math.pow(1 - t, 4);
      setTimeout(() => {
        const t0 = performance.now();
        const step = (now) => {
          const t = clamp((now - t0) / duration, 0, 1);
          num.textContent = (target * easeOut(t)).toFixed(decimals);
          if (t < 1) requestAnimationFrame(step);
          else settle(num);
        };
        requestAnimationFrame(step);
      }, delay);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        $$(".spec__num[data-final]", entry.target).forEach((num, i) => run(num, i * 110));
        io.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    $$(".spec").forEach((spec) => io.observe(spec));

    // Printing before scrolling must never show zeros
    window.addEventListener("beforeprint", () => nums.forEach(settle));
  }

  /* ── tilt · the portrait leans toward the pointer ──────────
     Deliberately small; the page must never feel unstable. */
  function tilt() {
    $$("[data-tilt]").forEach((el) => {
      const MAX = 3;
      const target = el.matches(".portrait") ? $(".portrait__frame", el) : el;
      if (!target) return;

      el.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch" || calm()) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        target.style.setProperty("--ry", `${px * MAX * 2}deg`);
        target.style.setProperty("--rx", `${-py * MAX * 2}deg`);
      });
      el.addEventListener("pointerleave", () => {
        target.style.setProperty("--ry", "0deg");
        target.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* ── magnetic · CTAs drift a few pixels toward the pointer ── */
  function magnetic() {
    $$("[data-magnetic]").forEach((el) => {
      const PULL = 5;
      el.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch" || calm()) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `translate(${px * PULL * 2}px, ${py * PULL}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
      el.addEventListener("blur", () => { el.style.transform = ""; });
    });
  }

  /* ── cursor · trailing ring for fine pointers ──────────────── */
  function cursor() {
    const ring = $(".cursor");
    if (!ring || !finePointer.matches || calm()) return;
    document.body.classList.add("cursor-on");

    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;
    let running = false;

    // Park it centre-screen so it never flashes in the corner
    ring.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;

    const frame = () => {
      cx = lerp(cx, tx, 0.18);
      cy = lerp(cy, ty, 0.18);
      ring.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) requestAnimationFrame(frame);
      else running = false;
    };

    const HOT = "a, button, input, textarea, label, [data-magnetic]";
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      tx = e.clientX;
      ty = e.clientY;
      document.body.classList.add("cursor-ready");
      if (!running) { running = true; requestAnimationFrame(frame); }
      document.body.classList.toggle("cursor-hot", Boolean(e.target.closest && e.target.closest(HOT)));
    }, { passive: true });

    document.addEventListener("pointerleave", () => document.body.classList.add("cursor-hide"));
    document.addEventListener("pointerenter", () => document.body.classList.remove("cursor-hide"));
  }

  /* ── scrollState · masthead, progress, sections, parallax ──
     Parallax layers drift at slightly different rates to build
     depth; the topographic paper moves least of all, so it reads
     as a plane behind everything else. */
  function scrollState() {
    const masthead = $("#masthead");
    const meterFill = $(".edge__fill");
    const toTop = $(".totop");
    const topo = $(".topo");
    const navlinks = $$(".navlink");
    const ticks = $$(".tick");
    const layers = $$("[data-parallax]");
    const sections = ["#home", "#about", "#projects", "#contact"]
      .map((id) => ({ id, el: $(id) }))
      .filter((s) => s.el);

    const setActive = (id) => {
      navlinks.forEach((l) => {
        const on = l.getAttribute("href") === id;
        l.classList.toggle("is-active", on);
        if (on) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
      });
      ticks.forEach((t) => t.classList.toggle("is-active", t.dataset.goto === id));
    };

    const runParallax = () => {
      if (calm()) return;
      const mid = window.innerHeight / 2;
      layers.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0;
        el.style.setProperty("--py", ((r.top + r.height / 2 - mid) * speed).toFixed(2));
      });
    };

    // The layer is 118vh tall; it travels its spare 18vh over the
    // whole page. Desktop only: on touch it simply stays put.
    const runTopo = (progress) => {
      if (!topo) return;
      if (calm() || !finePointer.matches) { topo.style.transform = ""; return; }
      topo.style.transform = `translate3d(0, ${(-progress * window.innerHeight * 0.18).toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (masthead) masthead.classList.toggle("is-stuck", y > 40);

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? clamp(y / scrollable, 0, 1) : 0;
      if (meterFill) meterFill.style.setProperty("--p", progress.toFixed(4));
      if (toTop) toTop.classList.toggle("is-shown", y > window.innerHeight * 0.6);

      // The section occupying the upper third of the viewport wins
      const line = y + window.innerHeight * 0.33;
      let current = sections.length ? sections[0].id : null;
      sections.forEach((s) => { if (s.el.offsetTop <= line) current = s.id; });
      if (current) setActive(current);

      runParallax();
      runTopo(progress);
    };

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { onScroll(); ticking = false; });
    }, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: calm() ? "auto" : "smooth" }));
    }
  }

  /* ── navigation · smooth anchors and the fullscreen menu ──── */
  function navigation() {
    const burger = $(".burger");
    const menu = $("#menu");

    const closeMenu = () => {
      if (!menu || !burger || !menu.classList.contains("is-open")) return;
      menu.classList.remove("is-open");
      burger.classList.remove("is-active");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open navigation menu");
      menu.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
    };

    const goTo = (selector) => {
      const target = $(selector);
      if (!target) return;
      target.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "start" });
    };

    $$('a[href^="#"]').forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || link.classList.contains("skip-link")) return;
      link.addEventListener("click", (e) => {
        if (!$(href)) return;
        e.preventDefault();
        closeMenu();
        goTo(href);
      });
    });

    $$(".tick").forEach((t) => t.addEventListener("click", () => goTo(t.dataset.goto)));

    if (burger && menu) {
      burger.addEventListener("click", () => {
        const open = !menu.classList.contains("is-open");
        menu.classList.toggle("is-open", open);
        burger.classList.toggle("is-active", open);
        burger.setAttribute("aria-expanded", String(open));
        burger.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
        menu.setAttribute("aria-hidden", String(!open));
        document.body.classList.toggle("is-locked", open);
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menu.classList.contains("is-open")) {
          closeMenu();
          burger.focus();
        }
      });
    }
  }

  /* ── contactForm · validated mailto hand-off ───────────────
     Each field reports its own error, wired to the input with
     aria-describedby and aria-invalid. Errors clear as soon as
     the value becomes valid. */
  function contactForm() {
    const form = $("#contact-form");
    if (!form) return;
    const feedback = $(".form__feedback", form);
    const submit = $('button[type="submit"]', form);

    const rules = {
      name: { test: (v) => v.length > 0, message: "Please add your name." },
      email: { test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: "Please use a valid email address." },
      message: { test: (v) => v.length > 0, message: "Please write a short message." }
    };
    const keys = Object.keys(rules);
    const input = (key) => form.elements[key];
    const valid = (key) => rules[key].test(input(key).value.trim());

    const mark = (key, invalid) => {
      const el = input(key);
      const field = el.closest(".field");
      const error = field ? $(".field__error", field) : null;
      if (field) field.classList.toggle("is-invalid", invalid);
      el.setAttribute("aria-invalid", String(invalid));
      if (error) error.textContent = invalid ? rules[key].message : "";
    };

    const say = (text, isError) => {
      if (!feedback) return;
      feedback.textContent = text;
      feedback.classList.toggle("is-error", Boolean(isError));
    };

    keys.forEach((key) => {
      const el = input(key);
      el.addEventListener("input", () => {
        if (el.getAttribute("aria-invalid") === "true" && valid(key)) mark(key, false);
      });
      el.addEventListener("blur", () => {
        if (el.value.trim() && !valid(key)) mark(key, true);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const bad = keys.filter((key) => !valid(key));
      keys.forEach((key) => mark(key, bad.includes(key)));

      if (bad.length) {
        say(bad.length === 1 ? "One field needs attention." : `${bad.length} fields need attention.`, true);
        input(bad[0]).focus();
        return;
      }

      const name = input("name").value.trim();
      const email = input("email").value.trim();
      const message = input("message").value.trim();
      const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:jamestiono02@gmail.com?subject=${subject}&body=${body}`;

      const label = submit ? $(".cta__label", submit) : null;
      const original = label ? label.textContent : "";
      if (label) label.textContent = "Opening your email app";
      if (submit) submit.disabled = true;
      say("", false);

      setTimeout(() => {
        if (label) label.textContent = original;
        if (submit) submit.disabled = false;
        say("Your email app should now have the message ready to send. Thank you for reaching out.", false);
        form.reset();
        keys.forEach((key) => input(key).removeAttribute("aria-invalid"));
      }, 1500);
    });
  }

  /* ── Boot ──────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    const modules = [intro, theme, typewriter, reveals, gallery, figures, tilt, magnetic, cursor, scrollState, navigation, contactForm];
    modules.forEach((mod) => {
      try {
        mod();
      } catch (err) {
        if (mod === intro) forceOpen();
        // eslint-disable-next-line no-console
        console.error(`[nervous] ${mod.name} failed`, err);
      }
    });
  });
})();
