# Aryo Rasaei — Web App Development portfolio

A hand-coded, buildless portfolio using HTML5, CSS and browser JavaScript. It contains exactly five pages:

| Page | Purpose |
| --- | --- |
| `index.html` | Professional introduction and selected work |
| `contact.html` | Email, LinkedIn and GitHub contact links |
| `skills.html` | Skills, experience and Excel certification |
| `showcase.html` | Power BI, charity research and restaurant prototype projects |
| `restaurant.html` | Fictional restaurant concept with a booking email-draft generator |

- Live website: https://aryorsaei05.github.io/Web_dev/
- Public repository: https://github.com/Aryorsaei05/Web_dev

## Run locally

Open `index.html` in a browser. There is no package installation or build step. Google Fonts needs an internet connection; system fonts provide a fallback.

Alternatively, from this directory run `python -m http.server 8000` and open `http://localhost:8000`. Stop the server with Ctrl+C.

## Project structure

- `assets/css/`: shared foundation, components, page styles and print layout. See [stylesheet organisation](assets/css/README.md).
- `assets/js/navigation.js`: responsive navigation with keyboard support.
- `assets/js/script.js`: skill interactions and native image dialogs.
- `assets/js/contact.js`: reduced-motion-aware contact entrance.
- `assets/js/restaurant.js`: input validation, email generation, preview and copy fallback.
- `assets/images/`: photographs, dashboard screenshots and certification evidence.

## Restaurant behaviour

Ember & Grain is explicitly fictional, including its address, telephone number (from Ofcom's range reserved for fiction) and opening hours. The recipient is the existing portfolio contact, not a restaurant-owned inbox. Generate a draft, review its content, then choose **Open email app** or **Copy draft**. The website does not send email, store input, reserve a table or confirm availability. Social links open sharing tools for the concept; they are not presented as restaurant-owned profiles.

The form checks required fields, email format, whole-number guest counts from 1–20 and dates from the visitor's current local day. Editing any field hides the previous draft. Subject and body are encoded independently to preserve special characters. Without JavaScript, a direct email link remains available. No database, backend or API credentials are used.

## Testing and validation

- **W3C validation:** all five pages were checked with the official W3C Nu HTML Checker (https://validator.w3.org/nu/) and every stylesheet with the W3C CSS Validation Service (https://jigsaw.w3.org/css-validator/), with no errors. The remaining CSS warnings are about custom properties (CSS variables) and one `pointer-events` value, which the validator cannot fully check; they are not errors.
- **Responsive layout:** every page was checked in Chrome at 320, 375, 768, 1024 and 1440 pixels wide for horizontal overflow and layout problems.
- **Links and images:** every internal link, page anchor and image path was checked, and every image has alternative text.
- **Restaurant form:** tested with empty required fields, an invalid email address, 0, 21 and fractional guest numbers, a past date, and special characters (`&`, `+`, accented letters and line breaks) in the generated email.
- **JavaScript:** all four scripts pass a syntax check (`node --check`).

## Deploy with GitHub Pages

The site is deployed with GitHub Pages from the `main` branch, with no build step: the five HTML pages and the `assets/` folder are served as they are.

## Sources and AI use

Research sources for the charity project are cited on the Showcase page. The Generative AI usage statement and full references are in the submitted Word/PDF document.
