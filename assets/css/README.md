# Stylesheet organisation

Each HTML page loads `base.css`, `layout.css`, and `components.css`, in that order, followed by its own stylesheets. Use direct stylesheet links; no build step is required.

| File | Responsibility |
| --- | --- |
| `base.css` | Theme variables, reset, global element defaults, accessibility |
| `layout.css` | Shared page widths, header, navigation, mobile menu, footer |
| `components.css` | Shared labels, headings, body copy, tag list, contact button, form controls |
| `pages/home.css` | Homepage hero, profile, Venture Café, capability tags, selected work cards |
| `pages/skills.css` | Skills orbit, galaxy, certificate, phone accordion |
| `pages/showcase.css` | General showcase content |
| `pages/showcase-powerbi.css` | Power BI project |
| `pages/showcase-research.css` | Research project |
| `pages/contact.css` | Contact page details |
| `pages/restaurant.css` | Restaurant concept, enquiry layout and email preview |
| `image-viewer.css` | Shared image dialog, loaded by Skills and Showcase |
| `print.css` | Showcase A4 print/PDF layout, loaded with `media="print"` |

The restaurant concept uses shared typography and form controls, with its own layout and email-preview stylesheet. Contact buttons and copy are shared with the homepage and restaurant page.

Keep responsive rules, animations, hover/focus states and reduced-motion rules in the same file as their feature. Rules within each file retain their original order because later rules may override earlier ones. Add new changes beside the relevant feature rather than appending unrelated overrides. CSS image paths are relative to the stylesheet: files in `pages/` need `../../images/`.

Each stylesheet begins with a header comment describing its role and a numbered list of contents; matching numbered section comments divide the file. Colours and fonts come from the custom properties in `base.css` (`--paper`, `--ink`, `--muted`, `--line`, `--accent`, `--serif`, `--sans`, `--mono`); use these instead of repeating the raw values. Shared breakpoints are 680px (phone), 681-900px (tablet) and 1099px (compact navigation, matched in `assets/js/navigation.js`).
