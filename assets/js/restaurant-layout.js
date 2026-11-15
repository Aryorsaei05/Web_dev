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
