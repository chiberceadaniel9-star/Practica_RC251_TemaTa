/**
 * system-control.js
 * RC-251 · Architect Dashboard · Ziua 7
 *
 * Module:
 *  1. Theme Toggle     — Dark/Light mode cu persistență localStorage
 *  2. Specular Tracking — Neural Glass reacționează la mouse (page-wide)
 *  3. Live Stat Counter — Actualizare periodică a valorii din hologram
 *  4. Form Status Label — Text dinamic în statusbar (augmentează CSS :has)
 */

'use strict';

/* ============================================================
   1. THEME TOGGLE
   Comută clasa .dark-theme pe <body> și persistă preferința
   în localStorage. Actualizează iconița și label-ul butonului.
============================================================ */
(function initTheme() {
  const body        = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel  = document.getElementById('themeLabel');
  const themeIcon   = themeToggle?.querySelector('.nav__toggle-icon');

  if (!themeToggle) return;

  /**
   * Aplică tema vizual și actualizează UI-ul butonului.
   * @param {boolean} dark — true pentru dark mode
   */
  function applyTheme(dark) {
    body.classList.toggle('dark-theme', dark);
    if (themeLabel) themeLabel.textContent = dark ? 'LIGHT MODE' : 'DARK MODE';
    if (themeIcon)  themeIcon.textContent  = dark ? '☀'          : '☽';
  }

  // Restaurează preferința salvată
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') applyTheme(true);

  // Listener pentru butonul de toggle
  themeToggle.addEventListener('click', () => {
    const isDark = body.classList.contains('dark-theme');
    applyTheme(!isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  });
})();


/* ============================================================
   2. SPECULAR TRACKING — Neural Glass
   Urmărește poziția mouse-ului pe întreaga pagină și actualizează
   variabilele CSS inline ale hologramului:
     --mx / --my : poziția highlight-ului specular (% în radial-gradient)
     --rx / --ry : rotația 3D (perspective tilt) în grade
   Toate transformările rulează pe compositor thread (GPU only).
============================================================ */
(function initSpecularTracking() {
  const glass    = document.getElementById('hologramGlass');
  const hologram = document.getElementById('hologram');

  if (!glass || !hologram) return;

  /**
   * Setează variabilele CSS pe elementul glass.
   * @param {number} mx  - poziție X specular [0..100]
   * @param {number} my  - poziție Y specular [0..100]
   * @param {number} rotX - rotație X în grade
   * @param {number} rotY - rotație Y în grade
   */
  function updateGlass(mx, my, rotX, rotY) {
    glass.style.setProperty('--mx',  mx   + '%');
    glass.style.setProperty('--my',  my   + '%');
    glass.style.setProperty('--rx',  rotX + 'deg');
    glass.style.setProperty('--ry',  rotY + 'deg');
  }

  // Mousemove pe întreaga pagină pentru specular complet
  document.addEventListener('mousemove', (e) => {
    const rect = hologram.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    // Offset normalizat față de centrul hologramului (-1 → +1)
    const dx = (e.clientX - cx) / (window.innerWidth  * 0.5);
    const dy = (e.clientY - cy) / (window.innerHeight * 0.5);

    // Clamp highlight în zona vizibilă [20..80]
    const mx = Math.min(Math.max(50 + dx * 30, 20), 80);
    const my = Math.min(Math.max(50 + dy * 30, 20), 80);

    // Tilt perspectivă — capped la ±15 grade
    const rotX = -(dy * 15);
    const rotY =   dx * 15;

    updateGlass(mx, my, rotX, rotY);
  });

  // Reset la ieșirea mouse-ului din fereastră
  document.addEventListener('mouseleave', () => {
    updateGlass(50, 40, 0, 0);
  });

  // Touch support pentru mobile (opțional)
  document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (!touch) return;

    const rect = hologram.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    const dx = (touch.clientX - cx) / (window.innerWidth  * 0.5);
    const dy = (touch.clientY - cy) / (window.innerHeight * 0.5);

    const mx = Math.min(Math.max(50 + dx * 30, 20), 80);
    const my = Math.min(Math.max(50 + dy * 30, 20), 80);

    updateGlass(mx, my, -(dy * 10), dx * 10);
  }, { passive: true });
})();


/* ============================================================
   3. LIVE SYSTEM STAT COUNTER
   Actualizează valoarea afișată în centrul hologramului la
   fiecare 3 secunde, simulând un monitor live de sistem.
============================================================ */
(function initLiveStat() {
  const statEl = document.getElementById('sysStat');
  if (!statEl) return;

  /**
   * Generează o valoare realistă de integritate sistem (96–99%).
   * @returns {string}
   */
  function generateStat() {
    return (96 + Math.random() * 3).toFixed(1) + '%';
  }

  // Actualizare periodică cu tranziție subtilă
  setInterval(() => {
    statEl.style.opacity = '0.4';
    setTimeout(() => {
      statEl.textContent = generateStat();
      statEl.style.opacity = '1';
    }, 300);
  }, 3000);

  // Tranziție CSS pe element (adăugată dinamic pentru a nu polua CSS-ul)
  statEl.style.transition = 'opacity 0.3s ease';
})();


/* ============================================================
   4. FORM STATUS LABEL
   Augmentează CSS :has cu un text descriptiv în statusbar.
   Logica de validare rămâne în CSS — JS actualizează doar textul
   vizibil pentru accesibilitate (aria-live="polite").
============================================================ */
(function initFormStatus() {
  const inputs    = document.querySelectorAll('.access-form__input[required]');
  const statusTxt = document.getElementById('formStatus');

  if (!inputs.length || !statusTxt) return;

  /**
   * Verifică dacă toate câmpurile required sunt valide și completate.
   * @returns {boolean}
   */
  function allInputsValid() {
    return [...inputs].every(input =>
      input.validity.valid && input.value.trim().length > 0
    );
  }

  /**
   * Actualizează textul statusbar-ului în funcție de starea formularului.
   */
  function updateStatusLabel() {
    statusTxt.textContent = allInputsValid()
      ? 'CREDENȚIALE VALIDATE · ACCES PERMIS'
      : 'AȘTEPTÂND CREDENȚIALE VALIDE...';
  }

  // Atașează listener pe fiecare câmp
  inputs.forEach(input => {
    input.addEventListener('input', updateStatusLabel);
    input.addEventListener('blur',  updateStatusLabel);
  });
})();