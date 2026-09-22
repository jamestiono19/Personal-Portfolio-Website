/* ============================================================
   NERVOUS.JS — Living interaction system for "Editorial Index"

   One shared pointer + scroll state drives the ambient canvas,
   contextual cursor, navigation signal, parallax and card depth.
   The work remains bounded: ≤18 particles, capped DPR, one RAF.
   ============================================================ */

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const smoothstep = (value) => value * value * (3 - 2 * value);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const calm = () => reduceMotion.matches;

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const masthead = $("#masthead");
    const menu = $("#menu");
    const burger = $(".burger");
    const meterFill = $(".edge__fill");
    const toTop = $(".totop");
    const navlinks = $$(".navlink");
    const menuLinks = $$(".menu__link");
    const ticks = $$(".tick");
    const navSignal = $(".nav-signal");
    const primaryNav = $(".masthead__nav");
    const sections = ["#home", "#about", "#projects", "#contact"]
      .map((id) => ({ id, name: id.slice(1), el: $(id), top: 0 }))
      .filter((section) => section.el);

    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.45,
      ringX: window.innerWidth * 0.5,
      ringY: window.innerHeight * 0.45,
      envX: window.innerWidth * 0.5,
      envY: window.innerHeight * 0.45,
      active: false
    };

    const pageState = {
      scrollY: window.scrollY,
      lastScrollY: window.scrollY,
      scrollProgress: 0,
      sectionIndex: 0,
      sectionMix: 0,
      activeId: null,
      navLockUntil: 0,
      documentVisible: !document.hidden
    };

    let masterFrame = 0;
    let lastFrameTime = performance.now();
    let lastAmbientDraw = 0;
    let scrollAnimation = 0;
    let ambientController = null;

    /* ── 1 · OPENING CURTAIN ─────────────────────────────── */
    const curtain = $(".curtain");
    const curtainNum = $(".curtain__num");

    const openPage = () => {
      if (document.body.classList.contains("is-open")) return;
      document.body.classList.add("is-open");
      if (curtain) setTimeout(() => curtain.remove(), 1200);
    };

    if (curtain && !calm()) {
      const duration = 700;
      const startedAt = performance.now();
      const count = (now) => {
        const progress = clamp((now - startedAt) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 2);
        if (curtainNum) {
          curtainNum.textContent = String(Math.round(eased * 100)).padStart(2, "0");
        }
        if (progress < 1) requestAnimationFrame(count);
        else setTimeout(openPage, 120);
      };
      requestAnimationFrame(count);
      setTimeout(openPage, 2200);
    } else {
      openPage();
    }

    /* ── 2 · THEME ───────────────────────────────────────── */
    const themeToggle = $("#theme-toggle");
    const metaTheme = $('meta[name="theme-color"]');
    const themeIcons = {
      sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2M12 20.5v2M3.6 3.6l1.4 1.4M19 19l1.4 1.4M1.5 12h2M20.5 12h2M3.6 20.4 5 19M19 5l1.4-1.4"/></svg>',
      moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z"/></svg>'
    };

    const applyTheme = (theme) => {
      const light = theme === "light";
      root.toggleAttribute("data-theme", light);
      if (light) root.setAttribute("data-theme", "light");

      if (themeToggle) {
        themeToggle.innerHTML = light ? themeIcons.moon : themeIcons.sun;
        themeToggle.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
      }
      if (metaTheme) metaTheme.setAttribute("content", light ? "#f2eee6" : "#0d0c0b");
      if (ambientController) ambientController.refreshPalette();
    };

    let storedTheme = null;
    try { storedTheme = localStorage.getItem("portfolio-theme"); } catch (error) { /* storage may be blocked */ }
    applyTheme(storedTheme || "dark");

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const nextTheme = root.getAttribute("data-theme") === "light" ? "dark" : "light";
        try { localStorage.setItem("portfolio-theme", nextTheme); } catch (error) { /* keep the current session theme */ }
        applyTheme(nextTheme);
      });
    }

    /* ── 3 · LIVING AMBIENT CANVAS ─────────────────────────
       Low-density nodes, sparse links, orbit lines and gradient
       fields share one canvas. Scroll chooses a continuously
       interpolated mood instead of swapping scenes abruptly. */
    const createAmbient = () => {
      const ambient = $(".ambient");
      const canvas = $(".ambient__canvas");
      const glowElement = $(".ambient__glow");
      const haloElements = $$(".ambient__halo");
      const context = canvas ? canvas.getContext("2d", { alpha: true }) : null;
      if (!ambient || !canvas || !context) {
        return { draw: () => {}, resize: () => {}, refreshPalette: () => {} };
      }

      const moods = [
        { energy: 1.00, speed: 0.54, links: 0.72, structure: 0.12, orbit: 0.88 },
        { energy: 0.54, speed: 0.30, links: 0.26, structure: 0.05, orbit: 0.48 },
        { energy: 0.84, speed: 0.42, links: 0.88, structure: 0.92, orbit: 0.68 },
        { energy: 0.42, speed: 0.24, links: 0.18, structure: 0.08, orbit: 0.36 }
      ];
      const currentMood = { ...moods[0] };
      const targetMood = { ...moods[0] };
      const particles = [];
      let width = 0;
      let height = 0;
      let dpr = 1;
      let accent = [226, 84, 44];
      let foreground = [243, 238, 231];

      const parseColor = (value, fallback) => {
        const match = value.trim().match(/^#([\da-f]{6})$/i);
        if (!match) return fallback;
        return [0, 2, 4].map((index) => parseInt(match[1].slice(index, index + 2), 16));
      };

      const rgba = (color, alpha) => `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;

      const refreshPalette = () => {
        const styles = getComputedStyle(root);
        accent = parseColor(styles.getPropertyValue("--accent"), accent);
        foreground = parseColor(styles.getPropertyValue("--fg"), foreground);
      };

      const makeParticle = (index) => ({
        x: Math.random() * Math.max(width, 1),
        y: Math.random() * Math.max(height, 1),
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.18,
        radius: 0.7 + Math.random() * 1.55,
        phase: index * 0.73 + Math.random() * Math.PI,
        depth: 0.45 + Math.random() * 0.8
      });

      const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        /* A slightly soft raster is intentional for ambience and keeps
           the full-screen canvas inexpensive on modest/mobile GPUs. */
        const quality = width > 900 ? 0.72 : 0.82;
        dpr = Math.min(window.devicePixelRatio || 1, 1.25) * quality;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const desired = width < 560 ? 9 : width < 900 ? 12 : 18;
        while (particles.length < desired) particles.push(makeParticle(particles.length));
        particles.length = desired;
        particles.forEach((particle) => {
          particle.x = clamp(particle.x, 0, width);
          particle.y = clamp(particle.y, 0, height);
        });
      };

      const setMood = (index, mix) => {
        const from = moods[index] || moods[0];
        const to = moods[Math.min(index + 1, moods.length - 1)] || from;
        Object.keys(targetMood).forEach((key) => {
          targetMood[key] = lerp(from[key], to[key], smoothstep(mix));
        });
      };

      const drawField = (now, staticFrame, frameDelta) => {
        const time = now * 0.0001;
        const scrollDrift = pageState.scrollProgress * height * 0.16;

        /* Pointer glow is a CSS layer moved by transform in the master
           loop. Repainting the same full-screen radial gradient here
           cut animation throughput in half on software/mobile GPUs. */
        const orbitX = width * 0.78 + (pointer.envX - width * 0.5) * 0.025;
        const orbitY = height * 0.25 + Math.sin(time * 3.2) * 18 + scrollDrift * 0.22;
        context.save();
        context.translate(orbitX, orbitY);
        context.rotate(time * 0.7 + pageState.scrollProgress * 0.32);
        [1, 0.68, 0.38].forEach((scale, index) => {
          context.beginPath();
          context.ellipse(0, 0, width * 0.16 * scale, width * 0.105 * scale, index * 0.36, 0, Math.PI * 2);
          context.strokeStyle = rgba(index === 2 ? accent : foreground, (0.035 + index * 0.012) * currentMood.orbit);
          context.lineWidth = 1;
          context.stroke();
        });
        context.restore();

        if (currentMood.structure > 0.04) {
          context.save();
          context.strokeStyle = rgba(foreground, 0.025 * currentMood.structure);
          context.lineWidth = 1;
          const spacing = Math.max(width / 7, 130);
          const offset = (pageState.scrollProgress * spacing * 2) % spacing;
          for (let x = offset - spacing; x < width + spacing; x += spacing) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x + height * 0.12, height);
            context.stroke();
          }
          context.restore();
        }

        const connectionDistance = 112 + currentMood.links * 56;
        for (let first = 0; first < particles.length; first += 1) {
          const particle = particles[first];

          if (!staticFrame) {
            const driftX = Math.sin(time * 11 + particle.phase) * 0.035;
            const driftY = Math.cos(time * 9 + particle.phase) * 0.028;
            particle.x += (particle.vx + driftX) * currentMood.speed * particle.depth * frameDelta;
            particle.y += (particle.vy + driftY) * currentMood.speed * particle.depth * frameDelta;

            if (pointer.active && finePointer.matches) {
              const dx = particle.x - pointer.envX;
              const dy = particle.y - pointer.envY;
              const distance = Math.hypot(dx, dy);
              if (distance > 0 && distance < 150) {
                const influence = (1 - distance / 150) * 0.18;
                particle.x += (dx / distance) * influence * frameDelta;
                particle.y += (dy / distance) * influence * frameDelta;
              }
            }

            if (particle.x < -8) particle.x = width + 8;
            if (particle.x > width + 8) particle.x = -8;
            if (particle.y < -8) particle.y = height + 8;
            if (particle.y > height + 8) particle.y = -8;
          }

          for (let second = first + 1; second < particles.length; second += 1) {
            const other = particles[second];
            const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
            if (distance >= connectionDistance) continue;
            const strength = (1 - distance / connectionDistance) * 0.075 * currentMood.links;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.strokeStyle = rgba(foreground, strength);
            context.lineWidth = 0.75;
            context.stroke();
          }

          context.beginPath();
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          context.fillStyle = rgba(first % 4 === 0 ? accent : foreground, 0.14 + 0.12 * currentMood.energy);
          context.fill();
        }
      };

      const draw = (now, staticFrame = false, frameDelta = 1) => {
        Object.keys(currentMood).forEach((key) => {
          currentMood[key] = lerp(currentMood[key], targetMood[key], staticFrame ? 1 : 0.035);
        });
        const canvasOpacity = staticFrame ? 0.3 : 0.42 + currentMood.energy * 0.16;
        const glowOpacity = staticFrame ? 0.18 : 0.2 + currentMood.energy * 0.1;
        const haloOpacity = staticFrame ? 0.24 : 0.22 + currentMood.orbit * 0.12;
        canvas.style.opacity = canvasOpacity.toFixed(3);
        if (glowElement) glowElement.style.opacity = glowOpacity.toFixed(3);
        haloElements.forEach((halo) => { halo.style.opacity = haloOpacity.toFixed(3); });
        context.clearRect(0, 0, width, height);
        drawField(now, staticFrame, frameDelta);
      };

      refreshPalette();
      resize();
      return { draw, resize, refreshPalette, setMood, ambient, glowElement };
    };

    ambientController = createAmbient();

    /* ── 4 · TYPEWRITER ──────────────────────────────────── */
    const typer = $("#typewriter-text");
    if (typer) {
      const words = ["data-driven", "interactive", "innovative", "impactful"];
      let wordIndex = 0;
      let characterIndex = 0;
      let deleting = false;

      if (calm()) {
        typer.textContent = words[0];
      } else {
        const type = () => {
          const word = words[wordIndex];
          characterIndex += deleting ? -1 : 1;
          typer.textContent = word.slice(0, characterIndex);
          let delay = deleting ? 45 : 95;

          if (!deleting && characterIndex === word.length) {
            deleting = true;
            delay = 1900;
          } else if (deleting && characterIndex === 0) {
            deleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            delay = 380;
          }
          setTimeout(type, delay);
        };
        setTimeout(type, 1400);
      }
    }

    /* ── 5 · STAGGERED REVEALS ───────────────────────────── */
    $$(".ln").forEach((line) => {
      const parent = line.parentElement;
      if (!parent || line.style.getPropertyValue("--i")) return;
      const siblings = $$(':scope > .ln', parent);
      if (siblings.length > 1) line.style.setProperty("--i", String(siblings.indexOf(line)));
    });

    const revealTargets = $$(".reveal, .statement, .contact__title .ln");
    if (calm() || !("IntersectionObserver" in window)) {
      revealTargets.forEach((element) => element.classList.add("is-in"));
    } else {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.01, rootMargin: "0px 0px -10% 0px" });
      revealTargets.forEach((element) => revealObserver.observe(element));
    }

    /* ── 6 · PROJECT FILTERS ─────────────────────────────── */
    const filters = $$(".filter");
    const works = $$(".work");
    const emptyNote = $(".gallery__empty");
    const filterStatus = $(".filters__status");

    const restripe = () => {
      let visibleIndex = 0;
      works.forEach((work) => {
        if (work.classList.contains("is-hidden") || work.classList.contains("work--lead")) return;
        work.classList.toggle("is-flip", visibleIndex % 2 === 1);
        visibleIndex += 1;
      });
    };

    const describeResults = (count, filter) => {
      if (count === 0) return "No projects in this discipline";
      const noun = count === 1 ? "project" : "projects";
      return filter === "all" ? `Showing all ${count} ${noun}` : `Showing ${count} ${noun}`;
    };

    filters.forEach((button) => {
      button.addEventListener("click", () => {
        filters.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        const requested = button.dataset.filter;
        let visibleCount = 0;

        works.forEach((work) => {
          const matches = requested === "all" || work.dataset.category === requested;
          work.classList.toggle("is-hidden", !matches);
          if (!matches) return;
          visibleCount += 1;
          work.classList.remove("is-in");
          requestAnimationFrame(() => requestAnimationFrame(() => work.classList.add("is-in")));
        });

        if (emptyNote) emptyNote.hidden = visibleCount !== 0;
        if (filterStatus) filterStatus.textContent = describeResults(visibleCount, requested);
        restripe();
        requestAnimationFrame(refreshGeometry);
      });
    });
    restripe();

    /* ── 7 · PROJECT SPOTLIGHT + TILT ────────────────────── */
    works.forEach((work) => {
      work.addEventListener("pointermove", (event) => {
        if (!finePointer.matches || calm()) return;
        const bounds = work.getBoundingClientRect();
        work.style.setProperty("--mx", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
        work.style.setProperty("--my", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
      }, { passive: true });
    });

    $$('[data-tilt]').forEach((element) => {
      const maxTilt = 3.2;
      const tiltTarget = element.matches(".portrait") ? $(".portrait__frame", element) : element;
      if (!tiltTarget) return;

      element.addEventListener("pointermove", (event) => {
        if (!finePointer.matches || calm()) return;
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        tiltTarget.style.setProperty("--ry", `${x * maxTilt * 2}deg`);
        tiltTarget.style.setProperty("--rx", `${-y * maxTilt * 2}deg`);
      }, { passive: true });

      element.addEventListener("pointerleave", () => {
        tiltTarget.style.setProperty("--ry", "0deg");
        tiltTarget.style.setProperty("--rx", "0deg");
      });
    });

    /* ── 8 · SELECTIVE MAGNETISM ─────────────────────────── */
    $$('[data-magnetic]').forEach((element) => {
      const pull = element.dataset.magnetic === "soft" ? 3 : 6;
      element.addEventListener("pointermove", (event) => {
        if (!finePointer.matches || calm()) return;
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        element.style.setProperty("--mag-x", `${x * pull * 2}px`);
        element.style.setProperty("--mag-y", `${y * pull}px`);
      }, { passive: true });

      const reset = () => {
        element.style.setProperty("--mag-x", "0px");
        element.style.setProperty("--mag-y", "0px");
      };
      element.addEventListener("pointerleave", reset);
      element.addEventListener("blur", reset);
    });

    /* ── 9 · CONTEXTUAL CURSOR + CLICK RIPPLE ────────────── */
    const cursor = $(".cursor");
    const cursorDot = $(".cursor__dot");
    const cursorRing = $(".cursor__ring");
    const cursorLabel = $(".cursor__label");
    const rippleLayer = $(".cursor-ripples");

    const cursorContext = (target) => {
      if (!(target instanceof Element)) return { state: "default", label: "" };
      if (target.closest("input, textarea, [contenteditable]")) return { state: "default", label: "" };
      if (target.closest(".work")) return { state: "project", label: "Explore" };
      if (target.closest(".portrait__frame")) return { state: "image", label: "View" };
      if (target.closest(".arrowlink, .channel, .footer__mail")) return { state: "external", label: "Open" };
      if (target.closest(".cta")) return { state: "button", label: target.closest('button[type="submit"]') ? "Send" : "Go" };
      if (target.closest(".filter")) return { state: "button", label: "Select" };
      if (target.closest(".navlink, .masthead__brand, .toggle, .tick, .totop, .cvlink")) return { state: "nav", label: "" };
      if (target.closest("a, button")) return { state: "nav", label: "" };
      return { state: "default", label: "" };
    };

    const updateCursorContext = (target) => {
      if (!cursor) return;
      const context = cursorContext(target);
      if (cursor.dataset.state !== context.state) cursor.dataset.state = context.state;
      if (cursorLabel && cursorLabel.textContent !== context.label) cursorLabel.textContent = context.label;
    };

    if (cursor && finePointer.matches && !calm()) {
      document.body.classList.add("cursor-on");
      const park = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      if (cursorDot) cursorDot.style.transform = park;
      if (cursorRing) cursorRing.style.transform = park;
    }

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;

      if (finePointer.matches && !calm()) {
        document.body.classList.add("cursor-on", "cursor-ready");
        document.body.classList.remove("cursor-hide");
        if (cursorDot) cursorDot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
        updateCursorContext(event.target);
      }
    }, { passive: true });

    document.addEventListener("pointerleave", () => {
      pointer.active = false;
      document.body.classList.add("cursor-hide");
    });
    document.addEventListener("pointerenter", () => document.body.classList.remove("cursor-hide"));

    document.addEventListener("pointerdown", (event) => {
      if (!rippleLayer || event.button !== 0 || event.pointerType === "touch" || calm() || !finePointer.matches) return;
      const ripple = document.createElement("span");
      ripple.className = "cursor-ripple";
      ripple.style.setProperty("--ripple-x", `${event.clientX}px`);
      ripple.style.setProperty("--ripple-y", `${event.clientY}px`);
      rippleLayer.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
      setTimeout(() => ripple.remove(), 600);
    }, { passive: true });

    /* ── 10 · NAVIGATION STATE + MOVING SIGNAL ───────────── */
    const refreshGeometry = () => {
      sections.forEach((section) => { section.top = section.el.offsetTop; });
      ambientController.resize();
      updateNavSignal();
      updateScrollState(true);
    };

    const updateNavSignal = () => {
      if (!navSignal || !primaryNav || window.innerWidth <= 860) return;
      const active = $(".navlink.is-active");
      if (!active) return;
      const navBounds = primaryNav.getBoundingClientRect();
      const activeBounds = active.getBoundingClientRect();
      navSignal.style.setProperty("--signal-x", `${activeBounds.left - navBounds.left}px`);
      navSignal.style.setProperty("--signal-w", `${activeBounds.width}px`);
    };

    const setActive = (id) => {
      if (pageState.activeId === id && $(".navlink.is-active")) return;
      pageState.activeId = id;
      navlinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === id));
      menuLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === id));
      ticks.forEach((tick) => tick.classList.toggle("is-active", tick.dataset.goto === id));
      root.dataset.ambientSection = id.slice(1);
      requestAnimationFrame(updateNavSignal);
    };

    const updateSectionMood = (scrollY) => {
      if (!sections.length) return;
      const sample = scrollY + window.innerHeight * 0.45;
      let index = 0;
      while (index < sections.length - 1 && sample >= sections[index + 1].top) index += 1;
      const nextIndex = Math.min(index + 1, sections.length - 1);
      const range = Math.max(sections[nextIndex].top - sections[index].top, 1);
      const mix = nextIndex === index ? 0 : clamp((sample - sections[index].top) / range, 0, 1);
      pageState.sectionIndex = index;
      pageState.sectionMix = mix;
      ambientController.setMood(index, mix);
    };

    const updateScrollState = (force = false) => {
      const y = window.scrollY;
      const delta = y - pageState.lastScrollY;
      pageState.scrollY = y;
      const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      pageState.scrollProgress = clamp(y / scrollable, 0, 1);

      if (masthead) {
        const depth = clamp(y / 260, 0, 1);
        masthead.style.setProperty("--nav-depth", depth.toFixed(3));
        masthead.style.setProperty("--nav-depth-percent", `${(depth * 100).toFixed(1)}%`);
        masthead.style.setProperty("--nav-blur", `${(depth * 16).toFixed(1)}px`);
        masthead.style.setProperty("--nav-saturation", (1 + depth * 0.12).toFixed(3));
        masthead.classList.toggle("is-stuck", y > 40);

        const desktop = window.innerWidth > 860;
        const menuOpen = menu && menu.classList.contains("is-open");
        const focused = masthead.classList.contains("has-keyboard-focus");
        const navLocked = performance.now() < pageState.navLockUntil;
        if (!desktop || y < 100 || delta < -3 || menuOpen || focused || navLocked) {
          masthead.classList.remove("is-hidden");
        } else if (delta > 7 && y > 180) {
          masthead.classList.add("is-hidden");
        }
      }

      if (meterFill) meterFill.style.setProperty("--p", pageState.scrollProgress.toFixed(4));
      if (toTop) toTop.classList.toggle("is-shown", y > window.innerHeight * 0.6);

      const activeLine = y + window.innerHeight * 0.33;
      let active = sections[0] ? sections[0].id : null;
      sections.forEach((section) => {
        if (section.top <= activeLine) active = section.id;
      });
      if (active) setActive(active);
      updateSectionMood(y);
      runElementParallax();
      /* Scrolling can move a different element beneath a stationary
         pointer, so resolve the cursor context even without mousemove. */
      if (pointer.active && finePointer.matches && !calm()) {
        updateCursorContext(document.elementFromPoint(pointer.x, pointer.y));
      }
      pageState.lastScrollY = y;

      if (force && masthead) masthead.classList.remove("is-hidden");
    };

    /* ── 11 · ELEMENT PARALLAX ───────────────────────────── */
    const parallaxLayers = $$('[data-parallax]');
    const runElementParallax = () => {
      if (calm()) return;
      const viewportMiddle = window.innerHeight * 0.5;
      parallaxLayers.forEach((element) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom < -200 || bounds.top > window.innerHeight + 200) return;
        const speed = parseFloat(element.dataset.parallax) || 0;
        const offset = (bounds.top + bounds.height * 0.5 - viewportMiddle) * speed;
        element.style.setProperty("--py", offset.toFixed(2));
      });
    };

    let scrollTicking = false;
    window.addEventListener("scroll", () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        updateScrollState();
        scrollTicking = false;
      });
    }, { passive: true });

    /* ── 12 · EASED INTERNAL NAVIGATION ──────────────────── */
    const cancelScrollAnimation = () => {
      if (scrollAnimation) cancelAnimationFrame(scrollAnimation);
      scrollAnimation = 0;
      root.classList.remove("is-programmatic-scroll");
    };

    const scrollToPosition = (targetY) => {
      cancelScrollAnimation();
      if (calm()) {
        window.scrollTo(0, targetY);
        return;
      }

      const from = window.scrollY;
      const distance = targetY - from;
      const duration = clamp(440 + Math.abs(distance) * 0.075, 480, 760);
      const startedAt = performance.now();
      pageState.navLockUntil = startedAt + duration + 180;
      root.classList.add("is-programmatic-scroll");
      if (masthead) masthead.classList.remove("is-hidden");

      const animate = (now) => {
        const progress = clamp((now - startedAt) / duration, 0, 1);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, from + distance * eased);
        if (progress < 1) scrollAnimation = requestAnimationFrame(animate);
        else {
          scrollAnimation = 0;
          root.classList.remove("is-programmatic-scroll");
        }
      };
      scrollAnimation = requestAnimationFrame(animate);
    };

    const goTo = (selector) => {
      const target = $(selector);
      if (!target) return;
      const headerOffset = window.innerWidth <= 860 ? 74 : 66;
      scrollToPosition(Math.max(target.offsetTop - headerOffset, 0));
    };

    $$('a[href^="#"]').forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || link.classList.contains("skip-link")) return;
      link.addEventListener("click", (event) => {
        if (!$(href)) return;
        event.preventDefault();
        closeMenu();
        goTo(href);
      });
    });
    ticks.forEach((tick) => tick.addEventListener("click", () => goTo(tick.dataset.goto)));
    window.addEventListener("wheel", cancelScrollAnimation, { passive: true });
    window.addEventListener("touchstart", cancelScrollAnimation, { passive: true });

    /* ── 13 · FULLSCREEN MOBILE MENU ─────────────────────── */
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
        if (masthead) masthead.classList.remove("is-hidden");
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menu.classList.contains("is-open")) {
          closeMenu();
          burger.focus();
        }
      });
    }

    /* Keyboard focus keeps navigation available; pointer focus does
       not pin it onscreen after an ordinary click. */
    if (masthead) {
      masthead.addEventListener("keydown", (event) => {
        if (event.key === "Tab") masthead.classList.add("has-keyboard-focus");
      });
      masthead.addEventListener("focusout", () => {
        requestAnimationFrame(() => {
          if (!masthead.contains(document.activeElement)) masthead.classList.remove("has-keyboard-focus");
        });
      });
      masthead.addEventListener("pointerdown", () => masthead.classList.remove("has-keyboard-focus"));
    }

    /* ── 14 · CONTACT FORM ───────────────────────────────── */
    const form = $("#contact-form");
    const feedback = $(".form__feedback");
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const nameElement = form.elements["name"];
        const emailElement = form.elements["email"];
        const messageElement = form.elements["message"];
        const submit = form.querySelector('button[type="submit"]');
        const name = nameElement.value.trim();
        const email = emailElement.value.trim();
        const message = messageElement.value.trim();
        const invalid = [];

        if (!name) invalid.push(nameElement);
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.push(emailElement);
        if (!message) invalid.push(messageElement);
        [nameElement, emailElement, messageElement].forEach((element) => {
          element.closest(".field").classList.toggle("is-invalid", invalid.includes(element));
        });

        if (invalid.length) {
          if (feedback) feedback.textContent = "Please complete all fields with a valid email.";
          invalid[0].focus();
          return;
        }

        const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
        window.location.href = `mailto:jamestiono02@gmail.com?subject=${subject}&body=${body}`;

        const label = submit ? $(".cta__label", submit) : null;
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

      $$(".field input, .field textarea", form).forEach((element) => {
        element.addEventListener("input", () => element.closest(".field").classList.remove("is-invalid"));
      });
    }

    if (toTop) toTop.addEventListener("click", () => scrollToPosition(0));

    /* ── 15 · ONE MASTER ANIMATION LOOP ──────────────────── */
    const animateEnvironment = (now) => {
      const delta = Math.min((now - lastFrameTime) / 16.667, 2);
      lastFrameTime = now;
      pointer.ringX = lerp(pointer.ringX, pointer.x, 0.16);
      pointer.ringY = lerp(pointer.ringY, pointer.y, 0.16);
      pointer.envX = lerp(pointer.envX, pointer.x, 0.035);
      pointer.envY = lerp(pointer.envY, pointer.y, 0.035);

      if (cursorRing && finePointer.matches && !calm()) {
        cursorRing.style.transform = `translate3d(${pointer.ringX}px, ${pointer.ringY}px, 0)`;
      }
      if (ambientController.glowElement) {
        ambientController.glowElement.style.transform = `translate3d(${pointer.envX}px, ${pointer.envY}px, 0) translate(-50%, -50%)`;
      }
      /* Atmospheric nodes only need a cinematic 30fps. The cursor
         remains on every display frame, so interaction still feels immediate. */
      if (now - lastAmbientDraw >= 32) {
        ambientController.draw(now, false, delta);
        lastAmbientDraw = now;
      }
      masterFrame = requestAnimationFrame(animateEnvironment);
    };

    const stopEnvironment = () => {
      cancelAnimationFrame(masterFrame);
      masterFrame = 0;
    };

    const syncMotion = () => {
      stopEnvironment();
      if (calm()) {
        document.body.classList.remove("cursor-on", "cursor-ready");
        ambientController.draw(performance.now(), true);
        return;
      }
      if (finePointer.matches && cursor) document.body.classList.add("cursor-on");
      if (pageState.documentVisible) {
        lastFrameTime = performance.now();
        lastAmbientDraw = 0;
        masterFrame = requestAnimationFrame(animateEnvironment);
      }
    };

    document.addEventListener("visibilitychange", () => {
      pageState.documentVisible = !document.hidden;
      if (pageState.documentVisible) syncMotion();
      else stopEnvironment();
    });
    reduceMotion.addEventListener("change", syncMotion);
    finePointer.addEventListener("change", syncMotion);

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refreshGeometry, 120);
    }, { passive: true });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refreshGeometry).catch(() => {});
    }
    window.addEventListener("load", refreshGeometry, { once: true });

    refreshGeometry();
    setActive(pageState.activeId);
    updateNavSignal();
    syncMotion();
  });
})();
