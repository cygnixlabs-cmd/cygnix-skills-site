# Cygnix Labs skills hub: skills.cygnixlabs.com

A one-page, 3D landing site for Cygnix Labs SEO + AEO tools, packages and contact. It's a static site served from GitHub Pages.

## Structure
- `template.html`: page source with `{{placeholders}}`
- `build.py`: writes `index.html`, `llms.txt`, `sitemap.xml` and `robots.txt` from the template plus `feed/cygnix-listings.json`
  - `python3 build.py --fetch` pulls the latest feed from `cygnixlabs-cmd/cygnix-seo-skills/feed/` first
  - At runtime the page also refreshes the tool cards from the same raw GitHub feed, so new listings appear without a rebuild. The cards are prerendered in HTML for crawlers.
- `assets/js/scene.js`: the Three.js hero, with the eagle core, orbiting tool cards, and "not indexed" pages being scanned and fixed. Three.js r160 is vendored in `assets/vendor/`.
  - The scene only loads on desktop with WebGL. Mobile, low-memory devices and `prefers-reduced-motion` get a light CSS 3D fallback.
- `assets/js/main.js`: renders the feed, the contact form, and the "Talk to us" guided assistant.
- The excluded actor slugs (`EXCLUDE`) in both `build.py` and `main.js` keep other projects' actors off the site.

## Forms (no backend)
Both the contact form and "Send this to the Cygnix team" in the chat post to FormSubmit:
`https://formsubmit.co/ajax/cygnixlabs@gmail.com`
- **First-time activation:** the first submission sends an activation email to cygnixlabs@gmail.com. Click "Activate form" once, and later messages arrive normally.
- **Switching to info@cygnixlabs.com:** when that inbox is live, change `FORM_ENDPOINT` in `assets/js/main.js` and `EMAIL` in `build.py`, replace the visible mailto links in `template.html`, then run `python3 build.py`. Activate the form again from the new inbox.

## Deploy
- `main` holds the source. `./deploy.sh` builds the site and publishes it to the `gh-pages` branch, which GitHub Pages serves.
- Live now at https://cygnixlabs-cmd.github.io/cygnix-skills-site/
- **Custom domain:** add a DNS record `CNAME  skills  →  cygnixlabs-cmd.github.io`, then set the domain:
  `gh api -X PUT repos/cygnixlabs-cmd/cygnix-skills-site/pages -f cname=skills.cygnixlabs.com`
  Then run `./deploy.sh` again. It copies `CNAME` into gh-pages once the domain is set. Turn on "Enforce HTTPS" when the certificate is issued:
  `gh api -X PUT repos/cygnixlabs-cmd/cygnix-skills-site/pages -F https_enforced=true`

## Content rules
- No fake testimonials or stats.
- Mock screens are labelled EXAMPLE or SAMPLE LAYOUT.
- The chat says it is an automated guide, and the team replies by email.

## Motion layer (`assets/js/motion.js`)
- GSAP 3.12.5, ScrollTrigger and Lenis 1.1.20 are vendored in `assets/vendor/`. Motion only animates transform and opacity.
- An inline head script sets `html.motion`, which turns motion on unless reduced motion is requested. It also sets `html.motion-lg` on desktops (981px or wider) with 4 GB of memory or more. The script sets these classes before first paint, so the layout never shifts.
- On `motion-lg`, the site gets smooth scroll, the pinned How it works sequence, the pinned Who it's for carousel, the particle background and the section depth exits.
- Phones get lighter, one-shot reveals.
- With reduced motion turned on, the page is static.
