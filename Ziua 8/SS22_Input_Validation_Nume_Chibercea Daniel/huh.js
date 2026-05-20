/* =============================================
   script.js — Ziua 8 | Fundamentele Securității Web
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ──────────────────────────────────────────
  // 1. Scroll-triggered fade-in animations
  // ──────────────────────────────────────────
  const animatedEls = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger each element slightly
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  animatedEls.forEach(el => observer.observe(el));


  // ──────────────────────────────────────────
  // 2. Threat meter bars (animate on scroll)
  // ──────────────────────────────────────────
  const threatBars = document.querySelectorAll('.threat-bar');

  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const level = bar.dataset.level || 0;
        // Small delay so the card animation plays first
        setTimeout(() => {
          bar.style.width = level + '%';
        }, 300);
        barObserver.unobserve(bar);
      }
    });
  }, { threshold: 0.5 });

  threatBars.forEach(bar => barObserver.observe(bar));


  // ──────────────────────────────────────────
  // 3. Interactive checklist with progress
  // ──────────────────────────────────────────
  const checkItems  = document.querySelectorAll('[data-check]');
  const progressBar = document.getElementById('progressBar');
  const progressLbl = document.getElementById('progressLabel');
  const checklist   = document.getElementById('checklist');
  const total       = checkItems.length;

  function updateProgress() {
    const done = document.querySelectorAll('[data-check].done').length;
    const pct  = Math.round((done / total) * 100);

    progressBar.style.setProperty('--pct', pct + '%');
    progressLbl.textContent = `${done} / ${total}`;

    if (done === total) {
      checklist.classList.add('all-done');
      spawnConfetti();
    } else {
      checklist.classList.remove('all-done');
    }
  }

  checkItems.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('done');
      updateProgress();
    });
  });

  // Initialise
  updateProgress();


  // ──────────────────────────────────────────
  // 4. Copy-to-clipboard for code block
  // ──────────────────────────────────────────
  const copyBtns = document.querySelectorAll('.copy-btn');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.code-block');
      // Grab raw text, stripping HTML tags
      const raw = block.innerText
        .replace(/^⎘ Copy\s*/i, '')   // remove button text
        .trim();

      navigator.clipboard.writeText(raw).then(() => {
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '⎘ Copy';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = raw;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '⎘ Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  });


  // ──────────────────────────────────────────
  // 5. Concept card keyboard accessibility
  // ──────────────────────────────────────────
  const conceptCards = document.querySelectorAll('.concept-card');
  conceptCards.forEach(card => {
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        card.classList.toggle('active');
      }
    });
  });


  // ──────────────────────────────────────────
  // 6. Mini confetti burst when all done ✓
  // ──────────────────────────────────────────
  function spawnConfetti() {
    const colors = ['#e8303a', '#00d4ff', '#2dff7e', '#ff6b35', '#ffffff'];
    const container = document.getElementById('checklist');
    const rect = container.getBoundingClientRect();

    for (let i = 0; i < 28; i++) {
      const dot = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size  = Math.random() * 7 + 4;
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + window.scrollY + 40;
      const angle  = Math.random() * 360;
      const dist   = Math.random() * 120 + 40;
      const tx     = Math.cos((angle * Math.PI) / 180) * dist;
      const ty     = Math.sin((angle * Math.PI) / 180) * dist - 60;

      dot.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        left: ${startX}px;
        top: ${startY}px;
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.9s ease, opacity 0.9s ease;
        opacity: 1;
        transform: translate(0,0) scale(1);
      `;

      document.body.appendChild(dot);

      // Trigger animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dot.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
          dot.style.opacity   = '0';
        });
      });

      setTimeout(() => dot.remove(), 1000);
    }
  }

});