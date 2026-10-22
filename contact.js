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
