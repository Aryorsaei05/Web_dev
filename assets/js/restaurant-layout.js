/** Transfers booking preferences within this page; never sends or stores an enquiry. */
(() => {
  'use strict';
  const quick = document.querySelector('#quick-enquiry');
  if (!quick) return;
  quick.addEventListener('submit', (event) => {
    event.preventDefault();
    for (const field of ['date', 'time', 'guests']) {
      const value = document.querySelector(`#quick-${field}`).value;
      if (value) document.querySelector(`#booking-${field}`).value = value;
    }
    document.querySelector('#enquiry-type').value = 'booking';
    const heading = document.querySelector('#booking-title');
    heading.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    document.querySelector('#booking-name').focus({ preventScroll: true });
  });
})();

/* Dining movements: one active atmosphere for hover, keyboard focus or touch selection. */
(() => {
  'use strict';
  const section = document.querySelector('.maison-experience');
  if (!section) return;
  const triggers = [...section.querySelectorAll('.movement-trigger')];
  let hovered = null;
  let focused = null;
  let selected = null;
  const render = () => {
    const active = hovered || focused || selected;
    section.dataset.movement = active || '';
    triggers.forEach(button => {
      const on = button.dataset.movement === active;
      button.closest('article').classList.toggle('movement-active', on);
      button.setAttribute('aria-pressed', String(button.dataset.movement === selected));
    });
  };
  triggers.forEach(button => {
    const article = button.closest('article');
    article.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        hovered = button.dataset.movement;
        render();
      }
    });
    article.addEventListener('pointerleave', () => { hovered = null; render(); });
    button.addEventListener('focus', () => { focused = button.dataset.movement; render(); });
    button.addEventListener('blur', () => { focused = null; render(); });
    button.addEventListener('click', () => {
      selected = selected === button.dataset.movement ? null : button.dataset.movement;
      render();
    });
  });
  section.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      selected = hovered = focused = null;
      render();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!section.contains(event.target)) {
      selected = focused = hovered = null;
      render();
    }
  });
})();
