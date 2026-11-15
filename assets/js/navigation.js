// Keep links available without JavaScript; enhance small screens with a menu.
document.querySelectorAll('.topbar').forEach((header) => {
  const nav = header.querySelector('nav');
  if (!nav) return;
  nav.id = 'main-navigation';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'menu-toggle';
  toggle.setAttribute('aria-controls', nav.id);
  toggle.innerHTML = '<span class="menu-toggle__icon" aria-hidden="true"><span></span><span></span></span>';
  header.insertBefore(toggle, nav);
  header.classList.add('has-menu');
  const compact = window.matchMedia('(max-width: 1099px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animation = null;
  const setOpen = (open) => {
    const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    const startHeight = nav.hidden ? 0 : nav.getBoundingClientRect().height;
    const startOpacity = nav.hidden ? 0 : getComputedStyle(nav).opacity;
    if (animation) animation.cancel();
    animation = null;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    header.classList.toggle('menu-open', open);
    const collapsed = compact.matches && !open;
    // Inert removes closing links from keyboard navigation immediately.
    nav.inert = collapsed;
    if (compact.matches && wasOpen !== open && !reducedMotion.matches && nav.animate) {
      nav.hidden = false;
      const endHeight = open ? nav.scrollHeight : 0;
      animation = nav.animate([
        { height: `${startHeight}px`, opacity: startOpacity },
        { height: `${endHeight}px`, opacity: open ? 1 : 0 },
      ], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      animation.onfinish = () => { nav.hidden = collapsed; animation = null; };
    } else {
      nav.hidden = collapsed;
    }
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && compact.matches && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
  compact.addEventListener('change', () => {
    const focusWasInNav = nav.contains(document.activeElement);
    const focusWasToggle = document.activeElement === toggle;
    setOpen(false);
    if (compact.matches && focusWasInNav) toggle.focus();
    if (!compact.matches && focusWasToggle) nav.querySelector('a').focus();
  });
  setOpen(false);
});
