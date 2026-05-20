/* ================================================
   RC 251 | Ziua 9 – script.js
   Accessibility Audit: WAI-ARIA implementation by Nume Prenume
   ================================================ */

'use strict';

/* ─────────────────────────────────────────
   1. HAMBURGER MENU – aria-expanded toggle
   ───────────────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const primaryNav = document.getElementById('primary-nav');

if (hamburger && primaryNav) {

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';

    // Toggle state
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    primaryNav.classList.toggle('is-open', !isOpen);

    // Manage body scroll when nav is open
    document.body.style.overflow = !isOpen ? 'hidden' : '';
  });

  // Close nav when a link inside it is clicked (SPA-style navigation)
  primaryNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      primaryNav.classList.remove('is-open');
      document.body.style.overflow = '';
      // Return focus to hamburger so keyboard users don't get lost
      hamburger.focus();
    });
  });

  // Close nav on ESC key – focus management best practice
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && primaryNav.classList.contains('is-open')) {
      hamburger.setAttribute('aria-expanded', 'false');
      primaryNav.classList.remove('is-open');
      document.body.style.overflow = '';
      hamburger.focus(); // Return focus to trigger element
    }
  });
}

/* ─────────────────────────────────────────
   2. FOCUS TRAP inside open mobile nav
   ───────────────────────────────────────── */
primaryNav && primaryNav.addEventListener('keydown', e => {
  if (!primaryNav.classList.contains('is-open')) return;
  if (e.key !== 'Tab') return;

  const focusable = Array.from(
    primaryNav.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.closest('[aria-hidden="true"]'));

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

/* ─────────────────────────────────────────
   3. ACTIVE NAV LINK – highlight current section
   ───────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.primary-nav a[href^="#"]');

const observerOptions = {
  root: null,
  rootMargin: '-40% 0px -55% 0px',
  threshold: 0
};

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      const isCurrent = link.getAttribute('href') === `#${entry.target.id}`;
      link.style.color = isCurrent ? 'var(--clr-text)' : '';
      link.style.borderColor = isCurrent ? 'var(--clr-accent)' : '';
      // For screen readers – mark current page section
      link.ariaCurrent = isCurrent ? 'true' : 'false';
    });
  });
}, observerOptions);

sections.forEach(sec => sectionObserver.observe(sec));

/* ─────────────────────────────────────────
   4. CONTACT FORM – accessible validation
   ───────────────────────────────────────── */
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();

    const fields = [
      { el: contactForm.querySelector('#name'),    msg: 'Numele este obligatoriu.' },
      { el: contactForm.querySelector('#email'),   msg: 'Adresa de email este obligatorie.' },
      { el: contactForm.querySelector('#message'), msg: 'Mesajul este obligatoriu.' },
    ];

    let firstError = null;

    fields.forEach(({ el, msg }) => {
      if (!el) return;
      const isEmpty = !el.value.trim();
      const isInvalidEmail = el.type === 'email' && el.value.trim() && !isValidEmail(el.value);

      if (isEmpty || isInvalidEmail) {
        const errorMsg = isInvalidEmail ? 'Adresa de email nu este validă.' : msg;
        showFieldError(el, errorMsg);
        if (!firstError) firstError = el;
      }
    });

    if (firstError) {
      // Move focus to first error field – screen reader will announce it
      firstError.focus();
    } else {
      showSuccessMessage(contactForm);
    }
  });
}

function showFieldError(fieldEl, message) {
  fieldEl.setAttribute('aria-invalid', 'true');

  const errorId = `error-${fieldEl.id}`;
  let errorEl = document.getElementById(errorId);

  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.id = errorId;
    errorEl.setAttribute('role', 'alert');
    errorEl.style.cssText = `
      color: #ff6b6b;
      font-size: .82rem;
      font-weight: 600;
      margin-top: .25rem;
      display: block;
    `;
    fieldEl.parentNode.appendChild(errorEl);
  }

  errorEl.textContent = message;
  // Associate error with field
  const described = fieldEl.getAttribute('aria-describedby') || '';
  if (!described.includes(errorId)) {
    fieldEl.setAttribute('aria-describedby', `${described} ${errorId}`.trim());
  }
}

function clearErrors() {
  document.querySelectorAll('[aria-invalid="true"]').forEach(el => {
    el.removeAttribute('aria-invalid');
  });
  document.querySelectorAll('[role="alert"]').forEach(el => el.remove());
}

function showSuccessMessage(form) {
  const successEl = document.createElement('div');
  successEl.setAttribute('role', 'status');     // Live region – polite announcement
  successEl.setAttribute('aria-live', 'polite');
  successEl.style.cssText = `
    background: rgba(0,229,195,.12);
    border: 1px solid var(--clr-accent-2);
    border-radius: var(--radius-sm);
    padding: 1rem 1.5rem;
    color: var(--clr-accent-2);
    font-weight: 700;
    margin-top: 1rem;
  `;
  successEl.textContent = '✓ Mesajul a fost trimis cu succes! Te vom contacta în curând.';
  form.appendChild(successEl);
  form.reset();
  successEl.focus();  // Move focus to confirmation
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* ─────────────────────────────────────────
   5. SMOOTH SCROLL POLYFILL (older browsers)
   ───────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // After scroll, set focus to heading inside section for screen readers
    const heading = target.querySelector('h1, h2, h3, [tabindex="-1"]');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  });
});

/* ─────────────────────────────────────────
   6. REDUCE MOTION – respect user preference
   ───────────────────────────────────────── */
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function applyReducedMotion(mq) {
  document.documentElement.style.setProperty(
    '--transition',
    mq.matches ? '0s' : '.25s ease'
  );
}
applyReducedMotion(motionQuery);
motionQuery.addEventListener('change', applyReducedMotion);