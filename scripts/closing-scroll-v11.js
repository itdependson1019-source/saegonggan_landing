/* 새:공간 V11 — progressive final CTA color deepening.
   Read-only scroll tracking. No impact on page tabs, form or AI partner. */
(function () {
  'use strict';
  const section = document.querySelector('.sgv11-closing');
  if (!section) return;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;
  function update() {
    pending = false;
    if (motionQuery.matches) {
      section.style.setProperty('--sgv11-shade','1');
      return;
    }
    const rect = section.getBoundingClientRect();
    const view = Math.max(window.innerHeight, 1);
    // First visible pixel -> 0; near the section center -> 1.
    const progress = Math.max(0, Math.min(1, (view - rect.top) / (view + rect.height * 0.36)));
    section.style.setProperty('--sgv11-shade', (0.08 + progress * 0.92).toFixed(3));
  }
  function schedule() {
    if (!pending) { pending = true; window.requestAnimationFrame(update); }
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  if (typeof motionQuery.addEventListener === 'function') motionQuery.addEventListener('change',schedule);
  update();
})();
