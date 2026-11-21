/* ============================================================
   app.js: entry point. Renders the data-driven parts, then
   wires navigation, the contact letter (mailto) and motion.
   ============================================================ */

import { renderAll, bindFilters } from "./render.js";
import {
  reduced, runGate, bindScroll, bindLanterns, bindStatement,
  bindReveals, bindCursor, bindSmoothScroll,
} from "./motion.js";

const EMAIL = "jamestiono02@gmail.com";
let lenis = null;

/* ── Navigation ───────────────────────────────────────────── */
function scrollToTarget(target) {
  const offset = -80;
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.1 });
  else {
    const top = target.getBoundingClientRect().top + scrollY + offset;
    scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  }
  // Move focus for keyboard and screen-reader users without a second jump.
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

function bindAnchors() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const target = id ? document.getElementById(id) : document.body;
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    scrollToTarget(target);
    history.replaceState(null, "", id ? `#${id}` : location.pathname);
  });
}

function bindNav() {
  const nav = document.querySelector(".nav");
  const links = [...document.querySelectorAll(".nav__link")];
  if (!nav) return;
  const sections = links.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => {
        if (l.getAttribute("href") === `#${en.target.id}`) l.setAttribute("aria-current", "true");
        else l.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-35% 0px -60% 0px" });
  sections.forEach((s) => io.observe(s));

  // Solid timber once the hero is behind us.
  const hero = document.querySelector(".hero");
  addEventListener("scroll", () => {
    nav.classList.toggle("is-solid", scrollY > (hero ? hero.offsetHeight - 120 : 400));
  }, { passive: true });
}

/* ── Mobile menu ──────────────────────────────────────────── */
const burger = () => document.querySelector(".nav__burger");
const menu = () => document.getElementById("menu");

function closeMenu(returnFocus = true) {
  const b = burger(), m = menu();
  if (!m || !m.classList.contains("is-open")) return;
  m.classList.remove("is-open");
  m.inert = true;
  b.setAttribute("aria-expanded", "false");
  document.body.classList.remove("is-locked");
  lenis && lenis.start();
  if (returnFocus) b.focus();
}

function bindMenu() {
  const b = burger(), m = menu();
  if (!b || !m) return;
  m.inert = true;
  b.addEventListener("click", () => {
    if (m.classList.contains("is-open")) return closeMenu();
    m.classList.add("is-open");
    m.inert = false;
    b.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
    lenis && lenis.stop();
    m.querySelector("a")?.focus();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  matchMedia("(min-width: 900px)").addEventListener("change", (e) => e.matches && closeMenu(false));
}

/* ── Contact letter: validates, then opens the mail client ─── */
function bindForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const feedback = form.querySelector(".form__feedback");
  const rules = {
    name: (v) => (v.trim().length >= 2 ? "" : "Add your name, so I know who to reply to."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "This address is incomplete. It needs an @ and a domain, like name@example.com."),
    message: (v) => (v.trim().length >= 10 ? "" : "Write at least 10 characters, so the message has something to answer."),
  };
  const check = (input) => {
    const msg = rules[input.name](input.value);
    const field = input.closest(".field");
    field.classList.toggle("is-invalid", !!msg);
    input.setAttribute("aria-invalid", String(!!msg));
    field.querySelector(".field__error").textContent = msg;
    return !msg;
  };
  Object.keys(rules).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener("blur", () => input.value && check(input));
    input.addEventListener("input", () => input.closest(".field").classList.contains("is-invalid") && check(input));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = Object.keys(rules).map((n) => form.elements[n]);
    const ok = inputs.map(check).every(Boolean);
    if (!ok) {
      feedback.textContent = "The letter isn't ready yet. Fix the marked fields, then press the seal again.";
      feedback.classList.add("is-error");
      inputs.find((i) => i.getAttribute("aria-invalid") === "true")?.focus();
      return;
    }
    const [name, email, message] = inputs.map((i) => i.value.trim());
    const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
    feedback.classList.remove("is-error");
    form.classList.add("is-sealed");
    feedback.textContent = `Opening your email app. If nothing opens, write to ${EMAIL}.`;
    location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  });
}

/* ── Boot ─────────────────────────────────────────────────── */
function boot() {
  window.__jt = true; // tells the head-script watchdog that the module loaded
  renderAll();
  bindFilters();
  bindAnchors();
  bindNav();
  bindMenu();
  bindForm();
  bindScroll();
  bindLanterns();
  bindStatement();
  bindReveals();
  bindCursor();

  runGate({
    onDone: async (fromGate) => {
      if (fromGate) document.getElementById("main")?.focus({ preventScroll: true });
      lenis = await bindSmoothScroll();
      // A deep link (#contact, #project-commonground) lands after the gate is gone.
      const target = location.hash && document.getElementById(location.hash.slice(1));
      if (target) scrollToTarget(target);
    },
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
