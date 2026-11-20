// @ts-check
/* ════════════════════════════════════════════════════════════════
   ui.js — interface behaviour that is not decoration:
     nav        active-section pill, mobile menu, smooth anchors
     filters    project tabs (animated, counts announced)
     contactForm  validated mailto hand-off (unchanged behaviour)
     toTop      back-to-top button
   ════════════════════════════════════════════════════════════════ */

import { $, $$, calm } from "./motion/utils.js";
import { CATEGORY_LABELS } from "./data/projects.js";

/** Scroll to an element, through Lenis when it is running. */
export function scrollToTarget(target, { focus = false } = {}) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  const lenis = /** @type {any} */ (window).__lenis;
  const offset = -(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
  if (lenis) lenis.scrollTo(el, { offset: el.id === "home" ? -9999 : offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: calm() ? "auto" : "smooth" });
  if (focus) {
    const f = /** @type {HTMLElement} */ (el);
    if (!f.hasAttribute("tabindex")) f.setAttribute("tabindex", "-1");
    f.focus({ preventScroll: true });
  }
}

function nav() {
  const header = $("#nav");
  const pill = $(".nav__pill");
  const indicator = $(".nav__indicator");
  const links = $$(".nav__link");
  const burger = $(".nav__burger");
  const menu = $("#mnav");

  // Moving pill behind the active link.
  const place = (link) => {
    if (!indicator || !pill || !link) return;
    const a = link.getBoundingClientRect();
    const b = pill.getBoundingClientRect();
    indicator.style.width = `${a.width}px`;
    indicator.style.transform = `translateX(${a.left - b.left}px)`;
  };
  const activate = (id) => {
    links.forEach((l) => {
      const on = l.dataset.section === id;
      if (on) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
      if (on) place(l);
    });
  };
  activate("home");
  window.addEventListener("resize", () => place(links.find((l) => l.hasAttribute("aria-current"))));
  document.fonts?.ready.then(() => place(links.find((l) => l.hasAttribute("aria-current"))));

  // The section crossing the upper third of the viewport is "active".
  const sections = ["home", "about", "stack", "work", "highlights", "contact"]
    .map((id) => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id === "highlights" ? "work" : e.target.id;
      activate(id);
    });
  }, { rootMargin: "-35% 0px -60% 0px" });
  sections.forEach((s) => io.observe(/** @type {Element} */ (s)));

  // Mobile menu
  const setMenu = (open) => {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
    if (open) $("a", menu)?.focus();
  };
  burger?.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burger?.getAttribute("aria-expanded") === "true") { setMenu(false); burger.focus(); }
  });

  // In-page anchors go through Lenis and move focus for keyboard users.
  document.addEventListener("click", (e) => {
    const a = /** @type {HTMLElement} */ (e.target)?.closest?.('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id === "#" || !document.querySelector(id)) return;
    e.preventDefault();
    setMenu(false);
    scrollToTarget(id, { focus: id !== "#home" && id !== "#main" });
    if (id === "#main") $("#main")?.focus({ preventScroll: true });
    history.replaceState(null, "", id);
  });

  // Hide the nav while reading down, bring it back on the way up.
  let last = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    const menuOpen = burger?.getAttribute("aria-expanded") === "true";
    header?.classList.toggle("is-hidden", !menuOpen && y > 600 && y > last + 4);
    if (y < last - 4 || y < 600) header?.classList.remove("is-hidden");
    last = y;
  }, { passive: true });
  header?.addEventListener("focusin", () => header.classList.remove("is-hidden"));
}

function filters() {
  const group = $("#filters");
  const status = $("#filters-status");
  if (!group) return;
  group.addEventListener("click", (e) => {
    const btn = /** @type {HTMLButtonElement|null} */ (/** @type {HTMLElement} */ (e.target).closest(".filter"));
    if (!btn || btn.disabled || btn.getAttribute("aria-pressed") === "true") return;
    const key = btn.dataset.filter || "all";
    $$(".filter", group).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));

    const cards = $$(".case");
    const show = cards.filter((c) => key === "all" || (c.dataset.cats || "").split(" ").includes(key));
    const hide = cards.filter((c) => !show.includes(c));
    const swap = () => {
      hide.forEach((c) => { c.hidden = true; c.classList.remove("is-leaving"); });
      show.forEach((c) => {
        const was = c.hidden;
        c.hidden = false;
        c.classList.remove("is-leaving");
        if (was && !calm()) { c.classList.remove("is-entering"); void c.offsetWidth; c.classList.add("is-entering"); }
      });
      window.dispatchEvent(new Event("layout-change"));
    };
    if (calm()) swap();
    else {
      hide.filter((c) => !c.hidden).forEach((c) => c.classList.add("is-leaving"));
      setTimeout(swap, 300);
    }
    if (status) {
      const label = key === "all" ? "" : ` ${CATEGORY_LABELS[key]}`;
      status.textContent = key === "all" ? `Showing all ${show.length} projects` : `Showing ${show.length}${label} project${show.length === 1 ? "" : "s"}`;
    }
  });
}

/* Validated mailto hand-off: each field reports its own error, wired
   with aria-describedby + aria-invalid; errors clear once valid. */
function contactForm() {
  const form = /** @type {HTMLFormElement|null} */ ($("#contact-form"));
  if (!form) return;
  const feedback = $(".form__feedback", form);
  const submit = /** @type {HTMLButtonElement|null} */ ($('button[type="submit"]', form));
  const rules = {
    name: { test: (v) => v.length > 0, message: "Please add your name." },
    email: { test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: "Please use a valid email address." },
    message: { test: (v) => v.length > 0, message: "Please write a short message." },
  };
  const keys = Object.keys(rules);
  const input = (k) => /** @type {HTMLInputElement} */ (form.elements.namedItem(k));
  const valid = (k) => rules[k].test(input(k).value.trim());
  const mark = (k, bad) => {
    const el = input(k);
    const field = el.closest(".field");
    const err = field ? $(".field__error", /** @type {HTMLElement} */ (field)) : null;
    field?.classList.toggle("is-invalid", bad);
    el.setAttribute("aria-invalid", String(bad));
    if (err) err.textContent = bad ? rules[k].message : "";
  };
  const say = (text, isError) => {
    if (!feedback) return;
    feedback.textContent = text;
    feedback.classList.toggle("is-error", Boolean(isError));
  };
  keys.forEach((k) => {
    const el = input(k);
    el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true" && valid(k)) mark(k, false); });
    el.addEventListener("blur", () => { if (el.value.trim() && !valid(k)) mark(k, true); });
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = keys.filter((k) => !valid(k));
    keys.forEach((k) => mark(k, bad.includes(k)));
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

    const label = submit ? $(".pill__label", submit) : null;
    const original = label ? label.textContent : "";
    if (label) label.textContent = "Opening your email app";
    if (submit) submit.disabled = true;
    say("", false);
    setTimeout(() => {
      if (label) label.textContent = original;
      if (submit) submit.disabled = false;
      say("Your email app should now have the message ready to send. Thank you for reaching out.", false);
      form.reset();
      keys.forEach((k) => input(k).removeAttribute("aria-invalid"));
    }, 1500);
  });
}

function toTop() {
  const btn = $(".totop");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("is-shown", window.scrollY > window.innerHeight * 1.2), { passive: true });
  btn.addEventListener("click", () => {
    scrollToTarget("#home");
    $("#hero-title")?.focus({ preventScroll: true });
  });
}

export function initUI() {
  nav();
  filters();
  contactForm();
  toTop();
}
