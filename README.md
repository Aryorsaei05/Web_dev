# Aryo Rasaei — Web App Development portfolio

A hand-coded, buildless portfolio using HTML5, CSS and browser JavaScript. It contains exactly five pages:

| Page | Purpose |
| --- | --- |
| `index.html` | Professional introduction and selected work |
| `contact.html` | Email, LinkedIn and GitHub contact links |
| `skills.html` | Skills, experience and Excel certification |
| `showcase.html` | Business showcase: Power BI, charity research and restaurant case study projects |
| `restaurant.html` | Ember & Grain restaurant case study with a booking enquiry email generator |

- Live website: https://aryorsaei05.github.io/Web_dev/
- Public repository: https://github.com/Aryorsaei05/Web_dev

## Run locally

Open `index.html` in a browser. There is no package installation or build step. Google Fonts needs an internet connection; system fonts provide a fallback.

Alternatively, from this directory run `python -m http.server 8000` and open `http://localhost:8000`. Stop the server with Ctrl+C.

## Project structure

- `assets/css/`: shared foundation, components, page styles and print layout. See [stylesheet organisation](assets/css/README.md).
- `assets/js/navigation.js`: responsive navigation with keyboard support.
- `assets/js/script.js`: interactive skills orbit and native image dialogs (lightbox).
- `assets/js/contact.js`: copy-email button with a manual-copy fallback.
- `assets/js/restaurant.js`: input validation, email generation, preview and copy fallback.
- `assets/images/`: photographs, dashboard screenshots, certificate and favicon.

## Restaurant behaviour

Ember & Grain is fictional, including its address, telephone number (from Ofcom's range reserved for fiction), opening hours and social media handles. Booking enquiries go to the portfolio author's email address. The website does not send email, store input, reserve a table or confirm availability.

- **Opening hours drive the form.** The hours are stored once in `restaurant.js`. Choosing a date fills the time list with 30-minute slots from opening until 90 minutes before closing; closed days and times already passed today are not offered. Dates use UK time and can be up to 90 days ahead.
- **Validation** shows an inline message under each invalid field (linked with `aria-describedby` and `aria-invalid`) and moves focus to the first problem. Guests must be a whole number from 1 to 20; larger groups are asked to phone.
- **Email draft.** The visitor reviews a preview, then chooses **Open email app** (a `mailto:` link with the subject and body encoded separately) or copies the message and subject. A warning appears if the link is long enough for some email apps to cut it short. Editing any field clears the previous draft.
- **Social media.** Follow links for Instagram, Facebook and X, plus share links for the page.
- Without JavaScript, a plain email link is offered instead.

## Testing and validation

- **W3C validation:** all five pages were checked with the official W3C Nu HTML Checker (https://validator.w3.org/nu/) and every stylesheet with the W3C CSS Validation Service (https://jigsaw.w3.org/css-validator/), with no errors. The only CSS warnings are the validator's standard notice that custom properties (CSS variables) are not statically checked; they are not errors.
- **Responsive layout:** every page was checked in Chrome at 320, 375, 768, 1024 and 1440 pixels wide for horizontal overflow and layout problems.
- **Links and images:** every internal link, page anchor and image path was checked, and every image has alternative text.
- **Restaurant form:** tested with empty required fields, an invalid email address, 0, 21 and fractional guest numbers, past dates, closed days (Monday), times already passed, and special characters (`&`, `+`, accented letters and line breaks) in the generated email.
- **JavaScript:** all four scripts pass a syntax check (`node --check`).

## Deploy with GitHub Pages

The site is deployed with GitHub Pages from the `main` branch, with no build step: the five HTML pages and the `assets/` folder are served as they are.

## Sources and AI use

Research sources for the charity project are cited on the Showcase page. The Generative AI usage statement and full references are in the submitted Word/PDF document.
