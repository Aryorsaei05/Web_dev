/*
 * contact.js - behaviour for the contact page (contact.html).
 *
 * 1. Plays a short fade-in on the page content, unless the visitor has
 *    asked their system for reduced motion.
 * 2. Reveals the "Copy email" button (hidden in the HTML so it never
 *    appears without JavaScript) and copies the address to the clipboard.
 *    If the Clipboard API is unavailable (for example on file:// pages or
 *    older browsers), it falls back to selecting the address so the
 *    visitor can copy it manually. Results are announced via #copy-status.
 */

// --- 1. Entrance animation -------------------------------------------------
const contactPage = document.querySelector(".contact-page");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (contactPage && !prefersReducedMotion && "animate" in contactPage) {
  contactPage.animate(
    [
      { opacity: 0, transform: "translateY(12px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: 500, easing: "ease-out" },
  );
}

// --- 2. Copy email button --------------------------------------------------
const copyButton = document.querySelector("#copy-email");
const copyStatus = document.querySelector("#copy-status");
const emailText = document.querySelector("#contact-email-address");

// Select the visible address so the visitor can press Ctrl+C / Cmd+C.
function selectEmailText() {
  const range = document.createRange();
  range.selectNodeContents(emailText);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

if (copyButton && copyStatus && emailText) {
  copyButton.hidden = false;

  copyButton.addEventListener("click", async () => {
    const address = copyButton.dataset.copy;

    try {
      // The Clipboard API needs a secure context (https or localhost).
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(address);
      copyStatus.textContent = `Email address copied: ${address}`;
    } catch (error) {
      // Fallback: highlight the address and ask for a manual copy.
      selectEmailText();
      copyStatus.textContent =
        "Email address selected. Press Ctrl+C (or Cmd+C on a Mac) to copy it.";
    }
  });
}
