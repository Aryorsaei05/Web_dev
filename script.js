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

// Preview with pointer/focus; clicking pins a skill until toggled or cleared.
document.querySelectorAll('.skills-page .skills-orbit').forEach((orbit) => {
  const controls = [...orbit.querySelectorAll('.skills-orbit__control')];
  const title = orbit.querySelector('.skills-orbit__title');
  const detail = orbit.querySelector('.skills-orbit__detail');
  const source = orbit.querySelector('.skills-orbit__source');
  const panel = orbit.querySelector('.skills-orbit__centre');
  const content = orbit.querySelector('.skills-orbit__content');
  const instruction = orbit.querySelector('.skills-orbit__instruction');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let fade = null;
  let ghost = null;
  const defaultTitle = title.textContent;
  const defaultDetail = detail.textContent;
  let selected = null;
  let hovered = null;
  let focused = null;

  const render = () => {
    const active = hovered || focused || selected;
    orbit.classList.toggle('is-interacting', Boolean(active));
    controls.forEach((control) => {
      control.setAttribute('aria-pressed', String(control === selected));
      control.classList.toggle('is-previewed', control === active);
    });
    const nextTitle = active ? active.querySelector('.skills-orbit__name').textContent : defaultTitle;
    const nextDetail = active ? document.getElementById(active.getAttribute('aria-describedby')).textContent : defaultDetail;
    const nextSource = active ? document.getElementById(active.dataset.source).textContent : '';
    const changed = title.textContent !== nextTitle || detail.textContent !== nextDetail;
    // Overlap the outgoing and incoming text inside a fixed panel for a true crossfade.
    if (changed) {
      if (fade) fade.cancel();
      if (ghost) ghost.remove();
      ghost = null;
      if (!reducedMotion.matches && content.animate) {
        ghost = content.cloneNode(true);
        ghost.classList.add('skills-orbit__ghost');
        ghost.setAttribute('aria-hidden', 'true');
        ghost.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
        panel.prepend(ghost);
        const outgoing = ghost;
        outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease' }).onfinish = () => outgoing.remove();
        fade = content.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease' });
      }
      content.scrollTop = 0;
    }
    instruction.hidden = Boolean(active);
    source.hidden = !active;
    if (source.textContent !== nextSource) source.textContent = nextSource;
    // Avoid repeating live-region announcements when the displayed text is unchanged.
    if (title.textContent !== nextTitle) title.textContent = nextTitle;
    if (detail.textContent !== nextDetail) detail.textContent = nextDetail;
  };

  controls.forEach((control, index) => {
    // Suppress pointer-induced scrolling; keyboard Tab retains native navigation.
    control.addEventListener('pointerdown', (event) => {
      if (event.button === 0 && event.pointerType === 'mouse') event.preventDefault();
    });
    control.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      hovered = control;
      render();
    });
    control.addEventListener('pointerleave', () => { hovered = null; render(); });
    control.addEventListener('focus', () => { focused = control.matches(':focus-visible') ? control : null; render(); });
    control.addEventListener('blur', () => { focused = null; render(); });
    control.addEventListener('click', (event) => {
      if (event.detail > 0) focused = null;
      selected = selected === control ? null : control;
      render();
    });
    control.addEventListener('keydown', (event) => {
      const offsets = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (event.key in offsets || event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (index + offsets[event.key] + controls.length) % controls.length;
        controls[next].focus({ preventScroll: true });
      } else if (event.key === 'Escape') {
        selected = null;
        hovered = null;
        focused = null;
        control.blur();
        render();
      }
    });
  });
});
