/**
 * script.js – RC251 | JavaScript ES6+
 * Autor: Nume Prenume
 * Funcționalități: Nav mobil, Scroll Reveal, Counter animat,
 *                  Validare formular, An curent în footer
 */

'use strict';

/* ──────────────────────────────────────────────
   1. AN CURENT ÎN FOOTER
   ────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

/* ──────────────────────────────────────────────
   2. NAVIGARE MOBILĂ (Hamburger)
   ────────────────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const mainNav   = document.getElementById('mainNav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('nav--open');
    navToggle.classList.toggle('nav__toggle--active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    // Blochează scroll-ul body când meniul e deschis
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Închide meniul la click pe un link
  mainNav.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('nav--open');
      navToggle.classList.remove('nav__toggle--active');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Închide meniul la apăsarea tastei Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav.classList.contains('nav--open')) {
      mainNav.classList.remove('nav--open');
      navToggle.classList.remove('nav__toggle--active');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      navToggle.focus();
    }
  });
}

/* ──────────────────────────────────────────────
   3. SCROLL REVEAL (Intersection Observer)
   ────────────────────────────────────────────── */
const revealEls = document.querySelectorAll(
  '.service-card, .project-card, .stat-card, .about__text, .contact__text, .contact-form, .hero__inner'
);

// Adaugă clasa reveal la toate elementele țintă
revealEls.forEach((el) => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        revealObserver.unobserve(entry.target); // Observă o singură dată
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

revealEls.forEach((el) => revealObserver.observe(el));

/* ──────────────────────────────────────────────
   4. COUNTER ANIMAT (statistici)
   ────────────────────────────────────────────── */
/**
 * Animează un element de la 0 la valoarea sa data-count.
 * @param {HTMLElement} el
 */
function animateCounter(el) {
  const target   = parseInt(el.dataset.count, 10);
  const duration = 1500; // ms
  const step     = 16;   // ~60fps
  const increment = target / (duration / step);
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.round(current);
  }, step);
}

const counterEls = document.querySelectorAll('[data-count]');

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

counterEls.forEach((el) => counterObserver.observe(el));

/* ──────────────────────────────────────────────
   5. VALIDARE FORMULAR DE CONTACT
   ────────────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');

/**
 * Afișează un mesaj de eroare pentru un câmp.
 * @param {HTMLInputElement|HTMLTextAreaElement} input
 * @param {string} errorId  – id-ul elementului de eroare
 * @param {string} message  – textul erorii
 */
function showError(input, errorId, message) {
  const errorEl = document.getElementById(errorId);
  if (errorEl) errorEl.textContent = message;
  input.classList.add('contact-form__input--error');
  input.setAttribute('aria-describedby', errorId);
}

/**
 * Șterge mesajul de eroare pentru un câmp.
 * @param {HTMLInputElement|HTMLTextAreaElement} input
 * @param {string} errorId
 */
function clearError(input, errorId) {
  const errorEl = document.getElementById(errorId);
  if (errorEl) errorEl.textContent = '';
  input.classList.remove('contact-form__input--error');
  input.removeAttribute('aria-describedby');
}

/**
 * Validează adresa de email cu regex simplu.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (contactForm) {
  const nameInput    = document.getElementById('name');
  const emailInput   = document.getElementById('email');
  const messageInput = document.getElementById('message');
  const formSuccess  = document.getElementById('formSuccess');

  // Validare în timp real (on blur)
  nameInput.addEventListener('blur', () => {
    if (!nameInput.value.trim()) {
      showError(nameInput, 'nameError', 'Numele este obligatoriu.');
    } else {
      clearError(nameInput, 'nameError');
    }
  });

  emailInput.addEventListener('blur', () => {
    if (!emailInput.value.trim()) {
      showError(emailInput, 'emailError', 'Emailul este obligatoriu.');
    } else if (!isValidEmail(emailInput.value.trim())) {
      showError(emailInput, 'emailError', 'Introduceți un email valid.');
    } else {
      clearError(emailInput, 'emailError');
    }
  });

  messageInput.addEventListener('blur', () => {
    if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
      showError(messageInput, 'messageError', 'Mesajul trebuie să aibă cel puțin 10 caractere.');
    } else {
      clearError(messageInput, 'messageError');
    }
  });

  // Submit
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    if (!nameInput.value.trim()) {
      showError(nameInput, 'nameError', 'Numele este obligatoriu.');
      isValid = false;
    } else {
      clearError(nameInput, 'nameError');
    }

    if (!emailInput.value.trim()) {
      showError(emailInput, 'emailError', 'Emailul este obligatoriu.');
      isValid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
      showError(emailInput, 'emailError', 'Introduceți un email valid.');
      isValid = false;
    } else {
      clearError(emailInput, 'emailError');
    }

    if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
      showError(messageInput, 'messageError', 'Mesajul trebuie să aibă cel puțin 10 caractere.');
      isValid = false;
    } else {
      clearError(messageInput, 'messageError');
    }

    if (isValid) {
      // Simulare trimitere (în producție: fetch() către backend)
      contactForm.reset();
      if (formSuccess) {
        formSuccess.hidden = false;
        setTimeout(() => { formSuccess.hidden = true; }, 5000);
      }
    } else {
      // Focus pe primul câmp cu eroare
      const firstError = contactForm.querySelector('.contact-form__input--error');
      if (firstError) firstError.focus();
    }
  });
}

/* ──────────────────────────────────────────────
   6. ACTIVE NAV LINK LA SCROLL (Scrollspy)
   ────────────────────────────────────────────── */
const sections = document.querySelectorAll('main section[id]');
const navLinks  = document.querySelectorAll('.nav__link');

const scrollspyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle(
            'nav__link--active',
            link.getAttribute('href') === `#${entry.target.id}`
          );
        });
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach((section) => scrollspyObserver.observe(section));

/* ──────────────────────────────────────────────
   7. SMOOTH BACK TO TOP (dacă există linkul)
   ────────────────────────────────────────────── */
const backToTop = document.querySelector('a[href="#hero"]');
if (backToTop) {
  backToTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}