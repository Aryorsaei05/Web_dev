/** Reveal only an available real Project 03 screenshot; shared lightbox behavior stays in script.js. */
(() => {
  const figure = document.querySelector('.restaurant-case__screenshot');
  if (!figure) return;
  const image = figure.querySelector('img');
  const show = () => {
    const loaded = image.naturalWidth > 0;
    figure.querySelector('a').hidden = !loaded;
    figure.querySelector('figcaption').hidden = !loaded;
    figure.querySelector('.restaurant-case__image-note').hidden = loaded;
  };
  image.addEventListener('load', show);
  image.addEventListener('error', show);
  if (image.complete) show();
})();
