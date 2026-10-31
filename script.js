// Allow one skill description to stay open when activated by click or keyboard.
document.querySelectorAll('.skill-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const row = trigger.closest('.skill-row');
    const willOpen = trigger.getAttribute('aria-expanded') !== 'true';

    document.querySelectorAll('.skill-trigger[aria-expanded="true"]').forEach((openTrigger) => {
      openTrigger.setAttribute('aria-expanded', 'false');
      openTrigger.closest('.skill-row').classList.remove('is-open');
    });

    if (willOpen) {
      trigger.setAttribute('aria-expanded', 'true');
      row.classList.add('is-open');
    }
  });
});