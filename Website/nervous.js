/* ============================================================
   NERVOUS.JS — Interactive Functionality
   Theme | Typewriter | Scroll Reveal | Filter | Form | Nav
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  // ── 1. THEME TOGGLE ──────────────────────────────────────
  const themeToggle = document.getElementById("theme-toggle");
  const htmlElement = document.documentElement;
  const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  function applyTheme(theme) {
    if (theme === "light") {
      htmlElement.setAttribute("data-theme", "light");
      themeToggle.innerHTML = moonIcon;
      themeToggle.setAttribute("aria-label", "Switch to dark mode");
    } else {
      htmlElement.removeAttribute("data-theme");
      themeToggle.innerHTML = sunIcon;
      themeToggle.setAttribute("aria-label", "Switch to light mode");
    }
  }

  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem("portfolio-theme") || "dark";
  applyTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = htmlElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    localStorage.setItem("portfolio-theme", newTheme);
    applyTheme(newTheme);
  });


  // ── 2. TYPEWRITER EFFECT ──────────────────────────────────
  const typewriterEl = document.getElementById("typewriter-text");
  if (typewriterEl) {
    const words = ["data-driven", "interactive", "innovative", "impactful"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function typewrite() {
      const currentWord = words[wordIndex];

      if (isDeleting) {
        typewriterEl.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 50;
      } else {
        typewriterEl.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 100;
      }

      if (!isDeleting && charIndex === currentWord.length) {
        // Pause at end of word
        typingSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typingSpeed = 400;
      }

      setTimeout(typewrite, typingSpeed);
    }

    // Start after a brief delay
    setTimeout(typewrite, 800);
  }


  // ── 3. SCROLL REVEAL (Intersection Observer) ──────────────
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          // Don't unobserve — keeps it simple, revealed class stays
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -60px 0px",
    }
  );

  document.querySelectorAll(".reveal").forEach((el) => {
    revealObserver.observe(el);
  });


  // ── 4. PROJECT FILTER ─────────────────────────────────────
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active button
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");

      projectCards.forEach((card) => {
        const category = card.getAttribute("data-category");

        if (filterValue === "all" || category === filterValue) {
          card.classList.remove("hidden");
          // Re-trigger reveal animation
          card.style.opacity = "0";
          card.style.transform = "translateY(20px)";
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
              card.style.opacity = "1";
              card.style.transform = "translateY(0)";
            });
          });
        } else {
          card.style.opacity = "0";
          card.style.transform = "translateY(10px)";
          setTimeout(() => {
            card.classList.add("hidden");
          }, 300);
        }
      });
    });
  });

  // Project card hover tilt and depth interaction
  projectCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") {
        return;
      }
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotateX = ((y - midY) / midY) * 5;
      const rotateY = ((x - midX) / midX) * -5;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "none";
    });
  });


  // ── 5. FLOATING LABEL FORM ────────────────────────────────
  const formInputs = document.querySelectorAll(".form-group input, .form-group textarea");

  formInputs.forEach((input) => {
    // Check initial state (e.g., browser autofill)
    if (input.value.trim() !== "") {
      input.classList.add("has-value");
    }

    input.addEventListener("focus", () => {
      input.classList.add("has-value");
    });

    input.addEventListener("blur", () => {
      if (input.value.trim() === "") {
        input.classList.remove("has-value");
      }
    });
  });

  // Form submission
  const contactForm = document.getElementById("contact-form");
  const formFeedback = document.querySelector(".form-feedback");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = contactForm.elements["name"].value.trim();
      const email = contactForm.elements["email"].value.trim();
      const message = contactForm.elements["message"].value.trim();
      const submitBtn = contactForm.querySelector(".form-submit .btn-primary");
      const originalText = submitBtn.textContent;

      if (!name || !email || !message) {
        if (formFeedback) {
          formFeedback.textContent = "Please complete all fields before sending.";
        }
        return;
      }

      const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
      const body = encodeURIComponent(`Name: ${name}
Email: ${email}

${message}`);
      window.location.href = `mailto:jamestiono02@gmail.com?subject=${subject}&body=${body}`;

      submitBtn.textContent = "Preparing email…";
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        if (formFeedback) {
          formFeedback.textContent = "Email draft opened in your mail app. Thank you for reaching out!";
        }
        contactForm.reset();
        formInputs.forEach((input) => input.classList.remove("has-value"));
      }, 1500);
    });
  }


  // ── 6. SMOOTH SCROLL & ACTIVE NAV ─────────────────────────
  const navLinks = document.querySelectorAll(".nav-item");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-item");
  const sections = document.querySelectorAll("section[id], header[id]");
  const navbar = document.querySelector(".navbar");
  const pageProgress = document.querySelector(".page-progress");
  const backToTopBtn = document.querySelector(".back-to-top");

  // Smooth scroll for nav links
  [...navLinks, ...mobileNavLinks].forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        // Close mobile menu if open
        closeMobileMenu();
      }
    });
  });

  // Active nav tracking on scroll
  function updateActiveNav() {
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  }

  // Navbar shrink on scroll
  function updateNavbar() {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }

  function updateProgress() {
    if (!pageProgress) return;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
    pageProgress.style.width = `${progress}%`;
  }

  function updateBackToTop() {
    if (!backToTopBtn) return;
    if (window.scrollY > window.innerHeight / 2) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  }

  window.addEventListener("scroll", () => {
    updateActiveNav();
    updateNavbar();
    updateProgress();
    updateBackToTop();
  }, { passive: true });


  // ── 7. MOBILE MENU ────────────────────────────────────────
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");

  function closeMobileMenu() {
    if (mobileMenu && mobileMenuBtn) {
      mobileMenu.classList.remove("active");
      mobileMenuBtn.classList.remove("active");
      mobileMenuBtn.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  }

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      const isActive = mobileMenu.classList.toggle("active");
      mobileMenuBtn.classList.toggle("active");
      mobileMenuBtn.setAttribute("aria-expanded", String(isActive));
      mobileMenu.setAttribute("aria-hidden", String(!isActive));
      document.body.style.overflow = isActive ? "hidden" : "";
    });

    // Close on outside click
    mobileMenu.addEventListener("click", (e) => {
      if (e.target === mobileMenu) {
        closeMobileMenu();
      }
    });
  }

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Initial calls
  updateActiveNav();
  updateNavbar();
  updateProgress();
  updateBackToTop();
});