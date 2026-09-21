/* ============================================================
   NERVOUS.JS — Interaction layer for "Editorial Index"

   Curtain · Theme · Typewriter · Staggered reveals · Filters
   Cursor ring · Magnetic CTAs · Card spotlight · Tilt
   Parallax · Scroll state · Menu · Contact form
   ============================================================ */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const calm = () => reduceMotion.matches;

  document.addEventListener("DOMContentLoaded", () => {

    /* ── 1 · OPENING CURTAIN ───────────────────────────────
       Short and non-blocking: it exists to set the tone, not
       to make anyone wait. Always resolves, even if slow. */
    const curtain = $(".curtain");
    const curtainNum = $(".curtain__num");

    const openPage = () => {
      if (document.body.classList.contains("is-open")) return;
      document.body.classList.add("is-open");
      if (curtain) setTimeout(() => curtain.remove(), 1200);
    };

    if (curtain && !calm()) {
      const duration = 700;
      const start = performance.now();
      const count = (now) => {
        const p = clamp((now - start) / duration, 0, 1);
        // ease-out so the number decelerates into 100
        const eased = 1 - Math.pow(1 - p, 2);
        if (curtainNum) {
          curtainNum.textContent = String(Math.round(eased * 100)).padStart(2, "0");
        }
        if (p < 1) requestAnimationFrame(count);
        else setTimeout(openPage, 120);
      };
      requestAnimationFrame(count);
      setTimeout(openPage, 2200); // hard safety net
    } else {
      openPage();
    }

    /* ── 2 · THEME ─────────────────────────────────────────── */
    const themeToggle = $("#theme-toggle");
    const root = document.documentElement;
    const metaTheme = $('meta[name="theme-color"]');

    const icons = {
      sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2M12 20.5v2M3.6 3.6l1.4 1.4M19 19l1.4 1.4M1.5 12h2M20.5 12h2M3.6 20.4 5 19M19 5l1.4-1.4"/></svg>',
      moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z"/></svg>'
    };

    const applyTheme = (theme) => {
      const light = theme === "light";
      if (light) root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme");

      if (themeToggle) {
        themeToggle.innerHTML = light ? icons.moon : icons.sun;
        themeToggle.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
      }
      if (metaTheme) metaTheme.setAttribute("content", light ? "#f2eee6" : "#0d0c0b");
    };

    let storedTheme = null;
    try { storedTheme = localStorage.getItem("portfolio-theme"); } catch (e) { /* private mode */ }
    applyTheme(storedTheme || "dark");

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
        try { localStorage.setItem("portfolio-theme", next); } catch (e) { /* ignore */ }
        applyTheme(next);
      });
    }

    /* ── 3 · TYPEWRITER ────────────────────────────────────── */
    const typer = $("#typewriter-text");
    if (typer) {
      const words = ["data-driven", "interactive", "innovative", "impactful"];
      let w = 0, c = 0, deleting = false;

      if (calm()) {
        typer.textContent = words[0];
      } else {
        const tick = () => {
          const word = words[w];
          let delay;

          if (deleting) {
            c -= 1;
            typer.textContent = word.slice(0, c);
            delay = 45;
          } else {
            c += 1;
            typer.textContent = word.slice(0, c);
            delay = 95;
          }

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
    }

    /* ── 4 · STAGGERED SCROLL REVEALS ──────────────────────
       Each headline's lines get sequential indices so they
       cascade rather than arriving all at once. */
    $$(".ln").forEach((line) => {
      const parent = line.parentElement;
      if (!parent || line.style.getPropertyValue("--i")) return;
      const siblings = $$(":scope > .ln", parent);
      if (siblings.length > 1) {
        line.style.setProperty("--i", String(siblings.indexOf(line)));
      }
    });

    const revealTargets = $$(".reveal, .statement, .contact__title .ln");

    if (calm() || !("IntersectionObserver" in window)) {
      revealTargets.forEach((el) => el.classList.add("is-in"));
    } else {
      /* threshold must stay near zero: a ratio like 0.15 never
         resolves for elements taller than the viewport (a project
         card can exceed 100vh), leaving them permanently hidden.
         The negative bottom margin is what delays the trigger. */
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.01, rootMargin: "0px 0px -10% 0px" });

      revealTargets.forEach((el) => revealObserver.observe(el));
    }

    /* ── 5 · PROJECT FILTER ────────────────────────────────── */
    const filters = $$(".filter");
    const works = $$(".work");
    const emptyNote = $(".gallery__empty");
    const filterStatus = $(".filters__status");

    // Keeps the alternating left/right rhythm correct after filtering
    const restripe = () => {
      let n = 0;
      works.forEach((work) => {
        if (work.classList.contains("is-hidden")) return;
        if (work.classList.contains("work--lead")) return;
        work.classList.toggle("is-flip", n % 2 === 1);
        n += 1;
      });
    };

    const describe = (count, label) => {
      if (count === 0) return "No projects in this discipline";
      const noun = count === 1 ? "project" : "projects";
      return label === "all"
        ? `Showing all ${count} ${noun}`
        : `Showing ${count} ${noun}`;
    };

    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        const want = btn.dataset.filter;
        let shown = 0;

        works.forEach((work) => {
          const match = want === "all" || work.dataset.category === want;
          if (match) shown += 1;
          work.classList.toggle("is-hidden", !match);

          if (match) {
            // Re-run the entrance so filtered results feel deliberate
            work.classList.remove("is-in");
            requestAnimationFrame(() => {
              requestAnimationFrame(() => work.classList.add("is-in"));
            });
          }
        });

        if (emptyNote) emptyNote.hidden = shown !== 0;
        if (filterStatus) filterStatus.textContent = describe(shown, want);
        restripe();
      });
    });

    restripe();

    /* ── 6 · CARD SPOTLIGHT ────────────────────────────────
       A faint light that tracks the cursor inside each card. */
    works.forEach((work) => {
      work.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch" || calm()) return;
        const r = work.getBoundingClientRect();
        work.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        work.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    });

    /* ── 7 · TILT ──────────────────────────────────────────
       Elements lean a couple of degrees toward the cursor.
       Deliberately small — the page must never feel unstable. */
    $$("[data-tilt]").forEach((el) => {
      const MAX = 3.2;

      el.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch" || calm()) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        const target = el.matches(".portrait") ? $(".portrait__frame", el) : el;
        if (!target) return;
        target.style.setProperty("--ry", `${px * MAX * 2}deg`);
        target.style.setProperty("--rx", `${-py * MAX * 2}deg`);
      });

      el.addEventListener("pointerleave", () => {
        const target = el.matches(".portrait") ? $(".portrait__frame", el) : el;
        if (!target) return;
        target.style.setProperty("--ry", "0deg");
        target.style.setProperty("--rx", "0deg");
      });
    });

    /* ── 8 · MAGNETIC BUTTONS ──────────────────────────────── */
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

    /* ── 9 · TRAILING CURSOR RING ──────────────────────────── */
    const cursor = $(".cursor");
    if (cursor && finePointer.matches && !calm()) {
      document.body.classList.add("cursor-on");

      let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
      let cx = tx, cy = ty;
      let running = false;

      // Park it centre-screen so it never flashes in the corner
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;

      const frame = () => {
        cx = lerp(cx, tx, 0.16);
        cy = lerp(cy, ty, 0.16);
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
          requestAnimationFrame(frame);
        } else {
          running = false;
        }
      };

      window.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        tx = e.clientX;
        ty = e.clientY;
        document.body.classList.add("cursor-ready");
        if (!running) { running = true; requestAnimationFrame(frame); }

        const hot = e.target.closest(
          'a, button, .work, .focus__row, input, textarea, [data-magnetic]'
        );
        document.body.classList.toggle("cursor-hot", Boolean(hot));
      }, { passive: true });

      document.addEventListener("pointerleave", () => document.body.classList.add("cursor-hide"));
      document.addEventListener("pointerenter", () => document.body.classList.remove("cursor-hide"));
    }

    /* ── 10 · PARALLAX ─────────────────────────────────────
       Layers drift at different rates to build depth. The
       differences are small on purpose. */
    const layers = $$("[data-parallax]");

    const runParallax = () => {
      if (calm()) return;
      const mid = window.innerHeight / 2;
      layers.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0;
        const offset = (r.top + r.height / 2 - mid) * speed;
        el.style.setProperty("--py", offset.toFixed(2));
      });
    };

    /* ── 11 · SCROLL STATE ─────────────────────────────────── */
    const masthead = $("#masthead");
    const meterFill = $(".edge__fill");
    const toTop = $(".totop");
    const navlinks = $$(".navlink");
    const ticks = $$(".tick");
    const sections = ["#home", "#about", "#projects", "#contact"]
      .map((id) => ({ id, el: $(id) }))
      .filter((s) => s.el);

    const setActive = (id) => {
      navlinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === id));
      ticks.forEach((t) => t.classList.toggle("is-active", t.dataset.goto === id));
    };

    const onScroll = () => {
      const y = window.scrollY;

      if (masthead) masthead.classList.toggle("is-stuck", y > 40);

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (meterFill) {
        meterFill.style.setProperty("--p", scrollable > 0 ? clamp(y / scrollable, 0, 1).toFixed(4) : "0");
      }

      if (toTop) toTop.classList.toggle("is-shown", y > window.innerHeight * 0.6);

      // The section occupying the upper third of the viewport wins
      const line = y + window.innerHeight * 0.33;
      let current = sections.length ? sections[0].id : null;
      sections.forEach((s) => {
        if (s.el.offsetTop <= line) current = s.id;
      });
      if (current) setActive(current);

      runParallax();
    };

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { onScroll(); ticking = false; });
    }, { passive: true });

    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    /* ── 12 · SMOOTH SCROLL ────────────────────────────────── */
    const goTo = (selector) => {
      const target = $(selector);
      if (!target) return;
      target.scrollIntoView({
        behavior: calm() ? "auto" : "smooth",
        block: "start"
      });
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

    ticks.forEach((t) => t.addEventListener("click", () => goTo(t.dataset.goto)));

    /* ── 13 · FULLSCREEN MENU ──────────────────────────────── */
    const burger = $(".burger");
    const menu = $("#menu");

    function closeMenu() {
      if (!menu || !burger || !menu.classList.contains("is-open")) return;
      menu.classList.remove("is-open");
      burger.classList.remove("is-active");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open navigation menu");
      menu.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
    }

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

    /* ── 14 · CONTACT FORM ─────────────────────────────────
       Same mailto handoff as before, with inline validation. */
    const form = $("#contact-form");
    const feedback = $(".form__feedback");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const nameEl = form.elements["name"];
        const emailEl = form.elements["email"];
        const messageEl = form.elements["message"];
        const submit = form.querySelector('button[type="submit"]');

        const name = nameEl.value.trim();
        const email = emailEl.value.trim();
        const message = messageEl.value.trim();

        const invalid = [];
        if (!name) invalid.push(nameEl);
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.push(emailEl);
        if (!message) invalid.push(messageEl);

        [nameEl, emailEl, messageEl].forEach((el) => {
          el.closest(".field").classList.toggle("is-invalid", invalid.includes(el));
        });

        if (invalid.length) {
          if (feedback) feedback.textContent = "Please complete all fields with a valid email.";
          invalid[0].focus();
          return;
        }

        const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
        window.location.href = `mailto:jamestiono02@gmail.com?subject=${subject}&body=${body}`;

        const label = submit ? submit.querySelector(".cta__label") : null;
        const original = label ? label.textContent : "";
        if (label) label.textContent = "Preparing email…";
        if (submit) submit.disabled = true;

        setTimeout(() => {
          if (label) label.textContent = original;
          if (submit) submit.disabled = false;
          if (feedback) feedback.textContent = "Email draft opened in your mail app. Thank you for reaching out!";
          form.reset();
        }, 1500);
      });

      // Clear the invalid state as soon as the visitor starts fixing it
      $$(".field input, .field textarea", form).forEach((el) => {
        el.addEventListener("input", () => {
          el.closest(".field").classList.remove("is-invalid");
        });
      });
    }

    /* ── 15 · BACK TO TOP ──────────────────────────────────── */
    if (toTop) {
      toTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: calm() ? "auto" : "smooth" });
      });
    }
  });
})();
