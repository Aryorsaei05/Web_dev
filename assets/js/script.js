/*
 * script.js - shared page behaviour (loaded by index.html, showcase.html and skills.html).
 *   1. Skills orbit (skills.html): enhances the always-visible skill evidence cards.
 *   2. Image lightbox (showcase.html, skills.html): native <dialog> viewer for a[data-lightbox].
 * Each block looks for its own elements first, so it does nothing on other pages.
 */

/*
 * 1. Skills orbit
 * The evidence cards (.skills-evidence__item) hold the only copy of each skill's text, so the
 * page is fully readable without JavaScript. On wide screens the orbit buttons preview a card in
 * the centre panel. A skill is "active" from one of three states, in priority order:
 *   - hovered:  a mouse or pen is over its button (temporary preview);
 *   - focused:  keyboard focus (:focus-visible) is on its button (temporary preview);
 *   - selected: its button was pressed (aria-pressed="true"); this stays until the button is
 *               pressed again or Escape is used, and its evidence card is highlighted.
 * The panel is deliberately not a live region and its heading is never rewritten, so hovering
 * causes no screen reader announcements; the pressed state is conveyed by aria-pressed.
 */
document.querySelectorAll('.skills-page .skills-orbit').forEach((orbit) => {
  const controls = [...orbit.querySelectorAll('.skills-orbit__control')];
  const network = orbit.querySelector('.skills-network');
  const networkPaths = [...orbit.querySelectorAll('.skills-network__path')];
  const panel = orbit.querySelector('.skills-orbit__centre');
  const content = orbit.querySelector('.skills-orbit__content');
  const preview = orbit.querySelector('.skills-orbit__preview');
  const instruction = orbit.querySelector('.skills-orbit__instruction');
  if (!controls.length || !panel || !content || !preview) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Each button's evidence card, matched by data-skill="x" -> id="skill-x".
  const cardFor = (control) => document.getElementById(`skill-${control.dataset.skill}`);
  const textOf = (parent, selector) => {
    const element = parent ? parent.querySelector(selector) : null;
    return element ? element.textContent : '';
  };
  let fade = null;
  let ghost = null;
  let shown = null;
  let selected = null;
  let hovered = null;
  let focused = null;

  // The instruction only makes sense once the buttons actually work.
  if (instruction) instruction.hidden = false;

  // Copy one skill's name, source and description (as plain text) into the preview.
  const fillPreview = (control) => {
    const card = cardFor(control);
    const parts = [
      ['skills-orbit__preview-name', textOf(control, '.skills-orbit__name')],
      ['skills-orbit__preview-source', textOf(card, '.skills-evidence__source')],
      ['skills-orbit__preview-detail', textOf(card, '.skills-evidence__description')],
    ];
    preview.replaceChildren(...parts.map(([className, text]) => {
      const paragraph = document.createElement('p');
      paragraph.className = className;
      paragraph.textContent = text;
      return paragraph;
    }));
  };

  // Each SVG ray is drawn at a fixed angle; remember it so it can be rotated onto its button.
  const networkGeometry = networkPaths.map((path) => {
    const point = path.querySelector('circle');
    return {
      path,
      baseAngle: point
        ? Math.atan2(Number(point.getAttribute('cy')) - 100, Number(point.getAttribute('cx')) - 100)
        : 0,
    };
  });
  let alignmentFrame = null;

  // Rotate every ray so it points at the centre of its button, whatever the stage size.
  const alignNetwork = () => {
    alignmentFrame = null;
    if (!network || !network.getClientRects().length || document.hidden) return;
    const matrix = network.getScreenCTM();
    if (!matrix) return;
    const inverse = matrix.inverse();
    networkGeometry.forEach(({ path, baseAngle }) => {
      const control = controls.find((button) => button.dataset.skill === path.dataset.skill);
      if (!control) return;
      const bounds = control.getBoundingClientRect();
      const target = new DOMPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
        .matrixTransform(inverse);
      const angle = Math.atan2(target.y - 100, target.x - 100);
      path.setAttribute('transform', `rotate(${(angle - baseAngle) * 180 / Math.PI} 100 100)`);
    });
  };
  // Batch alignment requests into a single update per animation frame.
  const scheduleAlignment = () => {
    if (alignmentFrame !== null) cancelAnimationFrame(alignmentFrame);
    alignmentFrame = requestAnimationFrame(alignNetwork);
  };
  // Resizing also covers the stage reappearing when the window widens past 1100px.
  window.addEventListener('resize', scheduleAlignment, { passive: true });
  document.addEventListener('visibilitychange', scheduleAlignment);
  scheduleAlignment();
  if (network && 'ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleAlignment);
    observer.observe(orbit.querySelector('.skills-orbit__stage') || network);
    observer.observe(network);
  }

  // Apply the hovered/focused/selected state to the buttons, rays, panel and cards.
  const render = () => {
    const active = hovered || focused || selected;
    if (network) network.classList.toggle('has-active', Boolean(active));
    networkPaths.forEach((path) => {
      path.classList.toggle('is-active', Boolean(active && path.dataset.skill === active.dataset.skill));
    });
    controls.forEach((control) => {
      control.setAttribute('aria-pressed', String(control === selected));
      control.classList.toggle('is-previewed', control === active);
      const card = cardFor(control);
      if (card) card.classList.toggle('is-highlighted', control === selected);
    });
    if (active === shown) return;

    // Crossfade: an aria-hidden copy of the old panel fades out over the new one.
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
    if (active) fillPreview(active);
    orbit.classList.toggle('has-preview', Boolean(active));
    content.scrollTop = 0;
    shown = active;
  };

  controls.forEach((control, index) => {
    // Stop a mouse press from scrolling to the button; keyboard focus behaves normally.
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
    // Toggle selection; a real mouse click (detail > 0) drops the keyboard focus preview.
    control.addEventListener('click', (event) => {
      if (event.detail > 0) focused = null;
      selected = selected === control ? null : control;
      render();
    });
    // Arrow keys, Home and End move round the orbit; Escape clears every state.
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

/*
 * 2. Image lightbox
 * Shared, native modal viewer: only explicitly marked image links opt in.
 * showModal() supplies background inertness and keyboard focus containment.
 */
(() => {
  const triggers = [...document.querySelectorAll('a[data-lightbox]')];
  if (!triggers.length) return;

  const viewer = document.createElement('dialog');
  viewer.className = 'image-lightbox';
  viewer.setAttribute('aria-label', 'Enlarged image');
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'image-lightbox__close';
  closeButton.setAttribute('aria-label', 'Close enlarged image');
  closeButton.autofocus = true;
  closeButton.textContent = '\u00d7';
  const image = document.createElement('img');
  image.className = 'image-lightbox__image';
  image.alt = '';
  viewer.append(closeButton, image);
  document.body.append(viewer);

  let activeTrigger = null;
  let scrollState = null;
  const close = () => { if (viewer.open) viewer.close(); };
  const open = (trigger) => {
    if (viewer.open) return;
    activeTrigger = trigger;
    const thumbnail = trigger.querySelector('img');
    image.src = trigger.href;
    image.alt = thumbnail ? thumbnail.alt : 'Enlarged image';
    const root = document.documentElement;
    const body = document.body;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    scrollState = {
      rootOverflow: root.style.overflow,
      rootPadding: root.style.paddingRight,
      bodyOverflow: body.style.overflow,
    };
    // Compensate for the hidden scrollbar without moving the underlying layout.
    if (scrollbarWidth > 0) {
      root.style.paddingRight = `${parseFloat(getComputedStyle(root).paddingRight) + scrollbarWidth}px`;
    }
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    viewer.showModal();
    closeButton.focus({ preventScroll: true });
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      open(trigger);
    });
    trigger.addEventListener('auxclick', (event) => event.preventDefault());
    trigger.addEventListener('keydown', (event) => {
      if (event.key === ' ') {
        event.preventDefault();
        open(trigger);
      }
    });
  });
  closeButton.addEventListener('click', close);
  // Require the gesture to start and end outside the image, avoiding drag dismissals.
  let startedOutside = false;
  viewer.addEventListener('pointerdown', (event) => { startedOutside = event.target === viewer; });
  viewer.addEventListener('click', (event) => {
    if (event.target === viewer && startedOutside) close();
    startedOutside = false;
  });
  viewer.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  viewer.addEventListener('close', () => {
    if (scrollState) {
      document.documentElement.style.overflow = scrollState.rootOverflow;
      document.documentElement.style.paddingRight = scrollState.rootPadding;
      document.body.style.overflow = scrollState.bodyOverflow;
      scrollState = null;
    }
    image.removeAttribute('src');
    if (activeTrigger && activeTrigger.isConnected) activeTrigger.focus({ preventScroll: true });
    activeTrigger = null;
  });
})();
