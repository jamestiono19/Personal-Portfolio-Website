/* ============================================================
   app.js — entry point. Renders the data-driven parts, then
   wires navigation, the contact form and the motion layer.
   ============================================================ */

import { renderAll, bindFilters } from "./render.js";
import {
  reduced, runGate, bindReveals, splitLines, bindScroll,
  bindTraces, bindPointer, bindCursor, bindSmoothScroll,
} from "./motion.js";

const EMAIL = "jamestiono02@gmail.com";
let lenis = null;

/* ── Navigation ───────────────────────────────────────────── */
function scrollToTarget(target) {
  const offset = -88;
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.2 });
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
    closeMenu();
    scrollToTarget(target);
    history.replaceState(null, "", id ? `#${id}` : location.pathname);
  });
}

function bindNav() {
  const nav = document.querySelector(".nav");
  const links = [...document.querySelectorAll(".nav__link")];
  const pill = document.querySelector(".nav__pill");
  const totop = document.querySelector(".totop");
  if (!nav) return;

  const movePill = (link) => {
    if (!pill || !link) { if (pill) pill.style.opacity = "0"; return; }
    pill.style.opacity = "1";
    pill.style.width = `${link.offsetWidth}px`;
    pill.style.transform = `translateX(${link.offsetLeft}px)`;
  };

  // Active section: the one whose band covers the upper third of the screen.
  const sections = links.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const link = links.find((l) => l.getAttribute("href") === `#${en.target.id}`);
      links.forEach((l) => l.setAttribute("aria-current", String(l === link)));
      movePill(link);
    });
  }, { rootMargin: "-30% 0px -65% 0px" });
  sections.forEach((s) => io.observe(s));
  addEventListener("resize", () => movePill(links.find((l) => l.getAttribute("aria-current") === "true")));

  // Hide while reading downward, return on any upward scroll.
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    nav.classList.toggle("is-hidden", y > 480 && y > lastY + 4 && !document.querySelector(".menu.is-open"));
    if (y < lastY - 4 || y < 480) nav.classList.remove("is-hidden");
    if (totop) totop.classList.toggle("is-shown", y > innerHeight * 1.2);
    lastY = y;
  }, { passive: true });

  nav.addEventListener("focusin", () => nav.classList.remove("is-hidden"));
}

/* ── Mobile menu ──────────────────────────────────────────── */
const burger = () => document.querySelector(".nav__burger");
const menu = () => document.getElementById("menu");

function closeMenu() {
  const b = burger(), m = menu();
  if (!m || !m.classList.contains("is-open")) return;
  m.classList.remove("is-open");
  m.setAttribute("aria-hidden", "true");
  m.inert = true;
  b.setAttribute("aria-expanded", "false");
  document.body.classList.remove("is-locked");
  lenis && lenis.start();
  b.focus();
}

function bindMenu() {
  const b = burger(), m = menu();
  if (!b || !m) return;
  m.inert = true;
  b.addEventListener("click", () => {
    if (m.classList.contains("is-open")) return closeMenu();
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
    m.inert = false;
    b.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
    lenis && lenis.stop();
    m.querySelector("a")?.focus();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  matchMedia("(min-width: 861px)").addEventListener("change", (e) => e.matches && closeMenu());
}

/* ── Contact form: validates, then opens the mail client ─── */
function bindForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const feedback = form.querySelector(".form__feedback");
  const rules = {
    name: (v) => (v.trim().length >= 2 ? "" : "Please enter your name."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email address."),
    message: (v) => (v.trim().length >= 10 ? "" : "Please write at least 10 characters."),
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
      feedback.textContent = "Please fix the highlighted fields.";
      feedback.classList.add("is-error");
      inputs.find((i) => i.getAttribute("aria-invalid") === "true")?.focus();
      return;
    }
    const [name, email, message] = inputs.map((i) => i.value.trim());
    const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
    feedback.classList.remove("is-error");
    feedback.textContent = "Opening your mail client. If nothing happens, write to " + EMAIL + ".";
    location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  });
}

/* ── Boot ─────────────────────────────────────────────────── */
function boot() {
  window.__jt = true; // tells the head-script watchdog that the module loaded
  renderAll();
  bindFilters();
  splitLines();
  bindReveals();
  bindAnchors();
  bindNav();
  bindMenu();
  bindForm();
  bindScroll();
  bindTraces();
  bindPointer();
  bindCursor();
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  runGate({
    onDone: async () => {
      lenis = await bindSmoothScroll();
      // A deep link (#contact, #p-commonground) lands after the gate is gone.
      const target = location.hash && document.getElementById(location.hash.slice(1));
      if (target) scrollToTarget(target);
    },
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
