/* =============================================================
   SCRIPT.JS — Portfolio Expert | The Ultralight Web
   Asset Optimization: WebP + Lazy Loading implemented by Nume Prenume
   ============================================================= */

'use strict';

/* ──────────────────────────────────────────────────────────────
   1. NAV MOBILE TOGGLE
   ────────────────────────────────────────────────────────────── */
(function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');

  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    // Animate hamburger → X
    toggle.classList.toggle('is-open', isOpen);
  });

  // Închide meniul la click pe un link
  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('is-open');
    });
  });
})();


/* ──────────────────────────────────────────────────────────────
   2. SCROLL REVEAL — IntersectionObserver
   Adaugă clasa .reveal pe elementele dorite în HTML și
   le va anima când intră în viewport
   ────────────────────────────────────────────────────────────── */
(function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.project-card, .gallery-item, .about-text, .about-figure, .metric-card, .hero-content, .hero-image-wrap'
  );

  if (!targets.length || !('IntersectionObserver' in window)) return;

  // Adăugăm clasa reveal dinamic (nu e nevoie s-o punem în HTML)
  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;

      // Delay cascadat pentru grile (proiecte, galerie)
      const delay = entry.target.dataset.index
        ? (parseInt(entry.target.dataset.index, 10) - 1) * 100
        : 0;

      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);

      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  targets.forEach(el => observer.observe(el));
})();


/* ──────────────────────────────────────────────────────────────
   3. LAZY LOAD cu IntersectionObserver (Polyfill pentru browsere vechi)
   Browserele moderne folosesc loading="lazy" nativ.
   Acest bloc oferă fallback pentru browsere fără suport nativ.
   ────────────────────────────────────────────────────────────── */
(function initLazyLoadPolyfill() {
  // Dacă browserul suportă lazy loading nativ, nu facem nimic
  if ('loading' in HTMLImageElement.prototype) {
    console.info('[LazyLoad] Native lazy loading is supported ✓');
    return;
  }

  console.info('[LazyLoad] Using IntersectionObserver polyfill...');

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');

  if (!lazyImages.length) return;

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const img = entry.target;
      const src = img.dataset.src || img.src;

      if (src) {
        const tempImg = new Image();
        tempImg.onload = () => {
          img.src = src;
          img.classList.add('lazy-loaded');
        };
        tempImg.src = src;
      }

      imageObserver.unobserve(img);
    });
  }, {
    rootMargin: '200px 0px', // Pre-load cu 200px înainte
    threshold: 0
  });

  lazyImages.forEach(img => imageObserver.observe(img));
})();


/* ──────────────────────────────────────────────────────────────
   4. METRICS ANIMATION — Animează ring-urile la scroll
   ────────────────────────────────────────────────────────────── */
(function initMetricsAnimation() {
  const metricsSection = document.querySelector('.metrics');
  if (!metricsSection || !('IntersectionObserver' in window)) return;

  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    if (animated || !entries[0].isIntersecting) return;
    animated = true;

    const cards = document.querySelectorAll('.metric-card');
    cards.forEach((card, i) => {
      const score  = parseInt(card.dataset.score || '0', 10);
      const ring   = card.querySelector('.ring-fill');
      const valueEl = card.querySelector('.metric-value');
      if (!ring || !valueEl) return;

      const circumference = 2 * Math.PI * 42; // r=42 → 263.89px
      const offset = circumference - (score / 100) * circumference;

      // Staggered delay per card
      setTimeout(() => {
        ring.style.strokeDashoffset = offset;

        // Count-up animation
        const duration = 1400;
        const start = performance.now();
        const from = 0;

        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          valueEl.textContent = Math.round(from + (score - from) * ease);
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      }, i * 180);
    });

    observer.disconnect();
  }, { threshold: 0.4 });

  observer.observe(metricsSection);
})();


/* ──────────────────────────────────────────────────────────────
   5. YEAR AUTO-UPDATE în footer
   ────────────────────────────────────────────────────────────── */
(function setYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ──────────────────────────────────────────────────────────────
   6. GALLERY LIGHTBOX simplu (click pe imagine → overlay)
   ────────────────────────────────────────────────────────────── */
(function initGalleryLightbox() {
  const items = document.querySelectorAll('.gallery-item img');
  if (!items.length) return;

  // Creează overlay DOM
  const overlay = document.createElement('div');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Previzualizare imagine');
  overlay.style.cssText = `
    display: none;
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.92);
    cursor: zoom-out;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  `;

  const lightboxImg = document.createElement('img');
  lightboxImg.style.cssText = `
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.8);
    animation: lightboxIn 0.3s ease;
  `;

  const style = document.createElement('style');
  style.textContent = `@keyframes lightboxIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }`;
  document.head.appendChild(style);

  overlay.appendChild(lightboxImg);
  document.body.appendChild(overlay);

  // Deschide lightbox
  items.forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  // Închide la click pe overlay
  overlay.addEventListener('click', () => {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  });

  // Închide cu ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
})();


/* ──────────────────────────────────────────────────────────────
   7. PERFORMANCE LOG — afișează în consolă statistici de bază
   Util pentru Network Tab verification (Checklist Perechea III)
   ────────────────────────────────────────────────────────────── */
(function logPerformanceInfo() {
  window.addEventListener('load', () => {
    const allImages  = document.querySelectorAll('img');
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const webpImages = document.querySelectorAll('img[src$=".webp"]');

    console.group('%c◈ Asset Optimization Report', 'color:#c8f03e; font-size:14px; font-weight:bold;');
    console.log(`Total imagini:        ${allImages.length}`);
    console.log(`Lazy loading active:  ${lazyImages.length}`);
    console.log(`Format WebP:          ${webpImages.length}`);
    console.log(`Acoperire lazy:       ${Math.round(lazyImages.length / allImages.length * 100)}%`);

    if ('performance' in window && 'getEntriesByType' in performance) {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        console.log(`DOM Content Loaded:   ${Math.round(nav.domContentLoadedEventEnd)}ms`);
        console.log(`Page Load Time:       ${Math.round(nav.loadEventEnd)}ms`);
      }
    }

    console.groupEnd();
  });
})();