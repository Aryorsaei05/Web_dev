/*
 * navigation.js - Responsive main navigation (all pages)
 * ---------------------------------------------------------------------------
 * Progressive enhancement: the HTML contains a normal <nav> of links that
 * works without JavaScript. On screens up to 1099px wide this script turns
 * it into a collapsible menu with a toggle button.
 *
 * Accessibility behaviour
 *   - The toggle is a real <button> with aria-controls pointing at the nav
 *     and aria-expanded reporting whether the menu is open; its aria-label
 *     changes between "Open" and "Close navigation menu".
 *   - A closed menu is hidden with the hidden attribute and made inert, so
 *     its links cannot be reached with Tab or by screen readers.
 *   - Escape closes the menu and returns focus to the toggle button.
 *   - Choosing a link, or clicking anywhere outside the header, closes it.
 *   - The open/close height animation is skipped for visitors who prefer
 *     reduced motion.
 *
 * Related styles: layout.css, section 6 "Mobile menu".
 */

document.querySelectorAll('.topbar').forEach((header) => {
  const nav = header.querySelector('nav');
  if (!nav) return;

  // Create the toggle button and link it to the nav it controls.
  nav.id = 'main-navigation';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'menu-toggle';
  toggle.setAttribute('aria-controls', nav.id);
  // Two decorative lines that layout.css animates into an "X" when open.
  toggle.innerHTML = '<span class="menu-toggle__icon" aria-hidden="true"><span></span><span></span></span>';
  header.insertBefore(toggle, nav);
  // .has-menu tells the CSS that the enhanced menu layout can be used.
  header.classList.add('has-menu');

  // Must match the 1099px breakpoint used for the menu in layout.css.
  const compact = window.matchMedia('(max-width: 1099px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animation = null;

  // Open or close the menu and keep the ARIA state, CSS class and
  // visibility in sync. On wide screens the nav is never collapsed.
  const setOpen = (open) => {
    const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    // Record the current size so an interrupted animation can reverse
    // smoothly from where it is rather than jumping.
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
      // Keep the nav visible while its height animates, then apply the
      // final hidden state once the animation has finished.
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

  // Close after a link is chosen (important for same-page #links).
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  // Escape closes an open menu and returns focus to the toggle button.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && compact.matches && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Clicking anywhere outside the header closes the menu.
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });

  // When the window crosses the breakpoint (resize or rotation), reset the
  // menu and move focus to an element that is still visible.
  compact.addEventListener('change', () => {
    const focusWasInNav = nav.contains(document.activeElement);
    const focusWasToggle = document.activeElement === toggle;
    setOpen(false);
    if (compact.matches && focusWasInNav) toggle.focus();
    if (!compact.matches && focusWasToggle) nav.querySelector('a').focus();
  });

  // Start closed on small screens (and fully visible on wide screens).
  setOpen(false);
});
