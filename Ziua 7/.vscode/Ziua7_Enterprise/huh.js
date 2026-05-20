// ============================================================
// script.js — Ziua 7 Enterprise Form
// Minimal JS: CSS handles all visual states.
// JS role: sync disabled attr + :empty demo
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Gatekeeper: sync disabled attribute ───────────────────
  // CSS handles all visual feedback.
  // JS only removes/adds [disabled] so CSS :not([disabled]) fires.

  const form      = document.querySelector('.form');
  const submitBtn = form.querySelector('.form__submit-btn');

  function isFormValid() {
    const required = [...form.querySelectorAll('[required]')];
    return required.every(el =>
      el.type === 'checkbox' ? el.checked : el.validity.valid
    );
  }

  function syncGatekeeper() {
    if (isFormValid()) {
      submitBtn.removeAttribute('disabled');
    } else {
      submitBtn.setAttribute('disabled', '');
    }
  }

  form.addEventListener('input',  syncGatekeeper);
  form.addEventListener('change', syncGatekeeper);

  // ── :empty state demo ─────────────────────────────────────
  // Uncomment the forEach block below to populate the container
  // and watch the "Niciun serviciu selectat." message disappear.

  const container = document.getElementById('serviceContainer');

  /*
  const demoServices = ['UI/UX Audit', 'Consultanță', 'Hosting'];
  demoServices.forEach(name => {
    const tag = document.createElement('span');
    tag.className = 'service-tag';
    tag.textContent = name;
    container.appendChild(tag);
  });
  */

  // ── Form submit ───────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
      name:    form.name.value,
      email:   form.email.value,
      phone:   form.phone.value,
      message: form.message.value,
      services: [...form.querySelectorAll('[name="service"]:checked')]
                  .map(cb => cb.value),
    };

    console.log('Form submitted:', data);

    // Visual feedback on button
    submitBtn.querySelector('.form__submit-btn__text').textContent = '✓ Trimis!';
    submitBtn.style.pointerEvents = 'none';
  });

});